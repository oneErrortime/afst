package services

import (
	"errors"
	"mime/multipart"

	"github.com/google/uuid"
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
	_, err := s.bookRepo.GetByID(bookID)
	if err != nil {
		return nil, errors.New("книга не найдена")
	}

	result, err := s.fileStorage.Upload(file, header)
	if err != nil {
		return nil, err
	}

	existing, _ := s.fileRepo.GetByHash(result.Hash)
	if existing != nil && existing.BookID == bookID {
		return nil, errors.New("файл с таким содержимым уже загружен для этой книги")
	}

	fileType := models.FileTypePDF
	switch result.MimeType {
	case "application/epub+zip":
		fileType = models.FileTypeEPUB
	case "application/x-mobipocket-ebook":
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
		IsProcessed:  false,
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
