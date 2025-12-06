package storage

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"sync"

	"github.com/google/uuid"
)

// MemoryStorage implements FileStorage in-memory for testing
type MemoryStorage struct {
	mu    sync.RWMutex
	files map[string][]byte
}

func NewMemoryStorage() *MemoryStorage {
	return &MemoryStorage{
		files: make(map[string][]byte),
	}
}

func (s *MemoryStorage) Upload(file multipart.File, header *multipart.FileHeader) (*UploadResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	id := uuid.New().String()
	ext := filepath.Ext(header.Filename)
	fileName := fmt.Sprintf("%s%s", id, ext)

	s.files[fileName] = data

	return &UploadResult{
		FileName: fileName,
		FilePath: fileName,
	}, nil
}

func (s *MemoryStorage) Get(fileName string) (*os.File, error) {
	return nil, fmt.Errorf("not implemented")
}

func (s *MemoryStorage) GetURL(filePath string) string {
	return filePath
}

func (s *MemoryStorage) Exists(filePath string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	_, ok := s.files[filePath]
	return ok
}

func (s *MemoryStorage) Delete(fileName string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.files[fileName]; !ok {
		return fmt.Errorf("file not found: %s", fileName)
	}

	delete(s.files, fileName)
	return nil
}

func (s *MemoryStorage) GetReader(fileName string) (io.ReadCloser, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, ok := s.files[fileName]
	if !ok {
		return nil, fmt.Errorf("file not found: %s", fileName)
	}
	return io.NopCloser(bytes.NewReader(data)), nil
}
