package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type bookmarkRepository struct {
	db *gorm.DB
}

func NewBookmarkRepository(db *gorm.DB) *bookmarkRepository {
	return &bookmarkRepository{db: db}
}

func (r *bookmarkRepository) Create(bookmark *models.Bookmark) error {
	return r.db.Create(bookmark).Error
}

func (r *bookmarkRepository) GetByBookID(userID, bookID uuid.UUID) ([]models.Bookmark, error) {
	var bookmarks []models.Bookmark
	err := r.db.Where("user_id = ? AND book_id = ?", userID, bookID).Preload("Book").Find(&bookmarks).Error
	return bookmarks, err
}

func (r *bookmarkRepository) GetAllByUserID(userID uuid.UUID) ([]models.Bookmark, error) {
	var bookmarks []models.Bookmark
	err := r.db.Where("user_id = ?", userID).Preload("Book").Find(&bookmarks).Error
	return bookmarks, err
}

func (r *bookmarkRepository) GetByID(id uuid.UUID) (*models.Bookmark, error) {
	var bookmark models.Bookmark
	err := r.db.First(&bookmark, "id = ?", id).Error
	return &bookmark, err
}

func (r *bookmarkRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Bookmark{}, "id = ?", id).Error
}
