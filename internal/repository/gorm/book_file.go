package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type bookFileRepository struct {
	db *gorm.DB
}

func NewBookFileRepository(db *gorm.DB) *bookFileRepository {
	return &bookFileRepository{db: db}
}

func (r *bookFileRepository) Create(file *models.BookFile) error {
	return r.db.Create(file).Error
}

func (r *bookFileRepository) GetByID(id uuid.UUID) (*models.BookFile, error) {
	var file models.BookFile
	err := r.db.Preload("Book").First(&file, "id = ?", id).Error
	return &file, err
}

func (r *bookFileRepository) GetByBookID(bookID uuid.UUID) ([]models.BookFile, error) {
	var files []models.BookFile
	err := r.db.Where("book_id = ?", bookID).Find(&files).Error
	return files, err
}

func (r *bookFileRepository) GetByHash(hash string) (*models.BookFile, error) {
	var file models.BookFile
	err := r.db.Where("hash = ?", hash).First(&file).Error
	return &file, err
}

func (r *bookFileRepository) Update(file *models.BookFile) error {
	return r.db.Save(file).Error
}

func (r *bookFileRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.BookFile{}, "id = ?", id).Error
}
