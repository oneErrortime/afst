package services

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type bookmarkService struct {
	repo repository.BookmarkRepository
}

func NewBookmarkService(repo repository.BookmarkRepository) BookmarkService {
	return &bookmarkService{repo: repo}
}

func (s *bookmarkService) CreateBookmark(bookmark *models.Bookmark) error {
	return s.repo.Create(bookmark)
}

func (s *bookmarkService) GetBookmarksByBookID(userID, bookID uuid.UUID) ([]models.Bookmark, error) {
	return s.repo.GetByBookID(userID, bookID)
}

func (s *bookmarkService) GetBookmarkByID(id uuid.UUID) (*models.Bookmark, error) {
	return s.repo.GetByID(id)
}

func (s *bookmarkService) DeleteBookmark(id uuid.UUID) error {
	return s.repo.Delete(id)
}
