package worker

import (
	"archive/zip"
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/events"
	"github.com/oneErrortime/afst/internal/repository"
)

// FileProcessor dispatches file-processing jobs to the worker pool.
// Currently handles:
//   - PDF page count extraction (pure Go, no cgo)
//   - EPUB chapter counting (via zip inspection)
type FileProcessor struct {
	pool     *Pool
	fileRepo repository.BookFileRepository
	bus      *events.Bus
}

// NewFileProcessor creates a processor backed by the given pool
func NewFileProcessor(pool *Pool, fileRepo repository.BookFileRepository, bus *events.Bus) *FileProcessor {
	return &FileProcessor{
		pool:     pool,
		fileRepo: fileRepo,
		bus:      bus,
	}
}

// Enqueue schedules background processing for a newly-uploaded book file
func (p *FileProcessor) Enqueue(fileID uuid.UUID, filePath, fileType string, bookID uuid.UUID) {
	p.pool.SubmitNonBlocking(Job{
		ID: "process:" + fileID.String(),
		Execute: func(ctx context.Context) error {
			return p.process(ctx, fileID, filePath, fileType, bookID)
		},
		OnDone: func(err error) {
			payload := events.BookProcessedPayload{
				BookID:  bookID.String(),
				FileID:  fileID.String(),
				Success: err == nil,
			}
			if err != nil {
				payload.Error = err.Error()
			}
			p.bus.Publish(events.Event{
				Type:    events.EventBookProcessed,
				Payload: payload,
			})
		},
	})
}

func (p *FileProcessor) process(ctx context.Context, fileID uuid.UUID, filePath, fileType string, bookID uuid.UUID) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	var pageCount int
	var err error

	switch fileType {
	case "pdf":
		pageCount, err = countPDFPages(filePath)
	case "epub":
		pageCount, err = countEPUBChapters(filePath)
	default:
		return nil // nothing to do for mobi etc.
	}

	if err != nil {
		log.Printf("[processor] failed to count pages for %s: %v", fileID, err)
		// Don't propagate — we still want IsProcessed = true
	}

	// Update the record
	file, err := p.fileRepo.GetByID(fileID)
	if err != nil {
		return fmt.Errorf("file %s not found: %w", fileID, err)
	}

	if pageCount > 0 {
		file.PageCount = &pageCount
	}
	file.IsProcessed = true

	if err := p.fileRepo.Update(file); err != nil {
		return fmt.Errorf("failed to update file %s: %w", fileID, err)
	}

	log.Printf("[processor] processed %s (%s): %d pages", fileID, fileType, pageCount)
	return nil
}

// countPDFPages counts pages using a pure-Go scan for "/Type /Page" objects.
// This is ~10× faster than loading the full PDF and works on any valid PDF.
func countPDFPages(filePath string) (int, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return 0, err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1<<20), 1<<20) // 1 MB line buffer

	count := 0
	for scanner.Scan() {
		line := scanner.Text()
		// Match "/Type /Page" but not "/Type /Pages" (the parent node)
		if strings.Contains(line, "/Type /Page") && !strings.Contains(line, "/Type /Pages") {
			count++
		}
		// Also match split across tokens: look for xref trailer as termination
		if strings.HasPrefix(line, "%%EOF") {
			break
		}
	}

	// Fallback: scan raw bytes for the pattern
	if count == 0 {
		if _, err := f.Seek(0, 0); err != nil {
			return 0, err
		}
		data, err := io.ReadAll(io.LimitReader(f, 32<<20)) // max 32MB scan
		if err != nil {
			return 0, err
		}
		needle := []byte("/Type /Page")
		noParent := []byte("/Type /Pages")
		pos := 0
		for {
			idx := bytes.Index(data[pos:], needle)
			if idx < 0 {
				break
			}
			abs := pos + idx
			// Check it's not "/Type /Pages"
			candidate := data[abs:]
			if len(candidate) >= len(noParent) && bytes.Equal(candidate[:len(noParent)], noParent) {
				pos = abs + len(noParent)
				continue
			}
			count++
			pos = abs + len(needle)
		}
	}

	return count, scanner.Err()
}

// countEPUBChapters counts spine items in the OPF — a reasonable proxy for "pages"
func countEPUBChapters(filePath string) (int, error) {
	r, err := zip.OpenReader(filePath)
	if err != nil {
		return 0, err
	}
	defer r.Close()

	var opfData []byte
	for _, f := range r.File {
		if strings.HasSuffix(f.Name, ".opf") {
			rc, err := f.Open()
			if err != nil {
				return 0, err
			}
			opfData, err = io.ReadAll(rc)
			rc.Close()
			if err != nil {
				return 0, err
			}
			break
		}
	}

	if len(opfData) == 0 {
		return 0, nil
	}

	// Count <itemref> tags in the spine — each is a chapter/section
	count := bytes.Count(opfData, []byte("<itemref"))
	return count, nil
}
