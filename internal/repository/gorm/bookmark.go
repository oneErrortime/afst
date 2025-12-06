package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
	"gorm.io/gorm"
)

type bookmarkRepository struct {
	db *gorm.DB
}

func NewBookmarkRepository(db *gorm.DB) repository.BookmarkRepository {
	return &bookmarkRepository{db: db}
}

func (r *bookmarkRepository) Create(bookmark *models.Bookmark) error {
	return r.db.Create(bookmark).Error
}

func (r *bookmarkRepository) GetByID(id uuid.UUID) (*models.Bookmark, error) {
	var bookmark models.Bookmark
	err := r.db.Preload("Book").Preload("File").First(&bookmark, "id = ?", id).Error
	return &bookmark, err
}

func (r *bookmarkRepository) GetByUserAndBook(userID, bookID uuid.UUID) ([]models.Bookmark, error) {
	var bookmarks []models.Bookmark
	err := r.db.
		Where("user_id = ? AND book_id = ?", userID, bookID).
		Preload("File").
		Order("page_number ASC, created_at DESC").
		Find(&bookmarks).Error
	return bookmarks, err
}

func (r *bookmarkRepository) GetByUser(userID uuid.UUID, limit, offset int) ([]models.Bookmark, error) {
	var bookmarks []models.Bookmark
	query := r.db.Where("user_id = ?", userID).Preload("Book").Preload("File").Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}
	err := query.Find(&bookmarks).Error
	return bookmarks, err
}

func (r *bookmarkRepository) Update(bookmark *models.Bookmark) error {
	return r.db.Save(bookmark).Error
}

func (r *bookmarkRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Bookmark{}, "id = ?", id).Error
}

func (r *bookmarkRepository) Count(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Bookmark{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}
