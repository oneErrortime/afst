package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type BookmarkService interface {
	Create(userID uuid.UUID, dto *models.CreateBookmarkDTO) (*models.Bookmark, error)
	GetByID(id uuid.UUID) (*models.Bookmark, error)
	GetMyBookmarks(userID uuid.UUID, limit, offset int) ([]models.Bookmark, error)
	GetBookBookmarks(userID, bookID uuid.UUID) ([]models.Bookmark, error)
	Update(id, userID uuid.UUID, dto *models.UpdateBookmarkDTO) (*models.Bookmark, error)
	Delete(id, userID uuid.UUID) error
}

type bookmarkService struct {
	bookmarkRepo repository.BookmarkRepository
	bookRepo     repository.BookRepository
	accessRepo   repository.BookAccessRepository
}

func NewBookmarkService(
	bookmarkRepo repository.BookmarkRepository,
	bookRepo repository.BookRepository,
	accessRepo repository.BookAccessRepository,
) BookmarkService {
	return &bookmarkService{
		bookmarkRepo: bookmarkRepo,
		bookRepo:     bookRepo,
		accessRepo:   accessRepo,
	}
}

func (s *bookmarkService) Create(userID uuid.UUID, dto *models.CreateBookmarkDTO) (*models.Bookmark, error) {
	book, err := s.bookRepo.GetByID(dto.BookID)
	if err != nil {
		return nil, errors.New("книга не найдена")
	}

	access, err := s.accessRepo.GetActiveByUserAndBook(userID, dto.BookID)
	if err != nil || access == nil {
		return nil, errors.New("нет доступа к этой книге")
	}

	if !access.IsValid() {
		return nil, errors.New("доступ к книге истёк")
	}

	bookmark := &models.Bookmark{
		UserID:      userID,
		BookID:      dto.BookID,
		FileID:      dto.FileID,
		PageNumber:  dto.PageNumber,
		Title:       dto.Title,
		Notes:       dto.Notes,
		Color:       dto.Color,
		IsImportant: dto.IsImportant,
	}

	if err := s.bookmarkRepo.Create(bookmark); err != nil {
		return nil, err
	}

	return bookmark, nil
}

func (s *bookmarkService) GetByID(id uuid.UUID) (*models.Bookmark, error) {
	return s.bookmarkRepo.GetByID(id)
}

func (s *bookmarkService) GetMyBookmarks(userID uuid.UUID, limit, offset int) ([]models.Bookmark, error) {
	return s.bookmarkRepo.GetByUser(userID, limit, offset)
}

func (s *bookmarkService) GetBookBookmarks(userID, bookID uuid.UUID) ([]models.Bookmark, error) {
	access, err := s.accessRepo.GetActiveByUserAndBook(userID, bookID)
	if err != nil || access == nil {
		return nil, errors.New("нет доступа к этой книге")
	}

	return s.bookmarkRepo.GetByUserAndBook(userID, bookID)
}

func (s *bookmarkService) Update(id, userID uuid.UUID, dto *models.UpdateBookmarkDTO) (*models.Bookmark, error) {
	bookmark, err := s.bookmarkRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("закладка не найдена")
	}

	if bookmark.UserID != userID {
		return nil, errors.New("нет прав на редактирование этой закладки")
	}

	if dto.PageNumber != nil {
		bookmark.PageNumber = *dto.PageNumber
	}
	if dto.Title != nil {
		bookmark.Title = dto.Title
	}
	if dto.Notes != nil {
		bookmark.Notes = dto.Notes
	}
	if dto.Color != nil {
		bookmark.Color = dto.Color
	}
	if dto.IsImportant != nil {
		bookmark.IsImportant = *dto.IsImportant
	}

	if err := s.bookmarkRepo.Update(bookmark); err != nil {
		return nil, err
	}

	return bookmark, nil
}

func (s *bookmarkService) Delete(id, userID uuid.UUID) error {
	bookmark, err := s.bookmarkRepo.GetByID(id)
	if err != nil {
		return errors.New("закладка не найдена")
	}

	if bookmark.UserID != userID {
		return errors.New("нет прав на удаление этой закладки")
	}

	return s.bookmarkRepo.Delete(id)
}
