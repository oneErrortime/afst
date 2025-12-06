package services

import (
	"archive/zip"
	"errors"
	"mime/multipart"
	"os"

	"github.com/google/uuid"
	epubparser "github.com/mathieu-keller/epub-parser"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
	"github.com/oneErrortime/afst/internal/storage"
)

type bookFileService struct {
	fileRepo    repository.BookFileRepository
	bookRepo    repository.BookRepository
	fileStorage storage.FileStorage
}

func NewBookFileService(
	fileRepo repository.BookFileRepository,
	bookRepo repository.BookRepository,
	fileStorage storage.FileStorage,
) BookFileService {
	return &bookFileService{
		fileRepo:    fileRepo,
		bookRepo:    bookRepo,
		fileStorage: fileStorage,
	}
}

func (s *bookFileService) Upload(bookID uuid.UUID, file multipart.File, header *multipart.FileHeader) (*models.BookFile, error) {
	book, err := s.bookRepo.GetByID(bookID)
	if err != nil {
		return nil, errors.New("книга не найдена")
	}

	result, err := s.fileStorage.Upload(file, header)
	if err != nil {
		return nil, err
	}

	existing, _ := s.fileRepo.GetByHash(result.Hash)
	if existing != nil && existing.BookID == bookID {
		s.fileStorage.Delete(result.FilePath) // Удаляем дубликат
		return nil, errors.New("файл с таким содержимым уже загружен для этой книги")
	}

	fileType := models.FileTypePDF
	if result.MimeType == "application/epub+zip" {
		fileType = models.FileTypeEPUB

		// Попробуем извлечь метаданные из EPUB
		f, err := os.Open(result.FilePath)
		if err == nil {
			defer f.Close()
			finfo, _ := f.Stat()
			zipReader, err := zip.NewReader(f, finfo.Size())
			if err == nil {
				epubBook, err := epubparser.OpenBook(zipReader)
				if err == nil {
					// Если метаданные в книге пустые, а в EPUB есть - обновляем
					if book.Title == "" && epubBook.Opf.Metadata.Title != nil && len(*epubBook.Opf.Metadata.Title) > 0 {
						book.Title = (*epubBook.Opf.Metadata.Title)[0].Text
					}
					if book.Author == "" && epubBook.Opf.Metadata.Creator != nil && len(*epubBook.Opf.Metadata.Creator) > 0 {
						book.Author = (*epubBook.Opf.Metadata.Creator)[0].Text
					}
					if book.Description == nil && epubBook.Opf.Metadata.Description != nil && len(*epubBook.Opf.Metadata.Description) > 0 {
						desc := (*epubBook.Opf.Metadata.Description)[0].Text
						book.Description = &desc
					}
					s.bookRepo.Update(book)
				}
			}
		}

	} else if result.MimeType == "application/x-mobipocket-ebook" {
		fileType = models.FileTypeMOBI
	}


	bookFile := &models.BookFile{
		BookID:       bookID,
		FileName:     result.FileName,
		OriginalName: result.OriginalName,
		FilePath:     result.FilePath,
		FileType:     fileType,
		FileSize:     result.FileSize,
		MimeType:     result.MimeType,
		Hash:         result.Hash,
		IsProcessed:  true, // Считаем обработанным после извлечения метаданных
	}

	if err := s.fileRepo.Create(bookFile); err != nil {
		s.fileStorage.Delete(result.FilePath)
		return nil, err
	}

	return bookFile, nil
}

func (s *bookFileService) GetByID(id uuid.UUID) (*models.BookFile, error) {
	return s.fileRepo.GetByID(id)
}

func (s *bookFileService) GetByBookID(bookID uuid.UUID) ([]models.BookFile, error) {
	return s.fileRepo.GetByBookID(bookID)
}

func (s *bookFileService) Delete(id uuid.UUID) error {
	file, err := s.fileRepo.GetByID(id)
	if err != nil {
		return err
	}

	if err := s.fileStorage.Delete(file.FilePath); err != nil {
		// Не возвращаем ошибку, т.к. файл может быть уже удален
	}

	return s.fileRepo.Delete(id)
}

func (s *bookFileService) ServeFile(id uuid.UUID) (string, string, error) {
	file, err := s.fileRepo.GetByID(id)
	if err != nil {
		return "", "", err
	}

	return file.FilePath, file.MimeType, nil
}
