package gorm

import (
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// readerRepository реализация ReaderRepository для GORM
type readerRepository struct {
	db *gorm.DB
}

// NewReaderRepository создает новый экземпляр readerRepository
func NewReaderRepository(db *gorm.DB) repository.ReaderRepository {
	return &readerRepository{db: db}
}

// Create создает нового читателя
func (r *readerRepository) Create(reader *models.Reader) error {
	return r.db.Create(reader).Error
}

// GetByID находит читателя по ID
func (r *readerRepository) GetByID(id uuid.UUID) (*models.Reader, error) {
	var reader models.Reader
	err := r.db.Where("id = ?", id).First(&reader).Error
	if err != nil {
		return nil, err
	}
	return &reader, nil
}

// GetAll возвращает всех читателей с пагинацией
func (r *readerRepository) GetAll(limit, offset int) ([]models.Reader, error) {
	var readers []models.Reader
	err := r.db.Limit(limit).Offset(offset).Find(&readers).Error
	return readers, err
}

// Update обновляет читателя
func (r *readerRepository) Update(reader *models.Reader) error {
	return r.db.Save(reader).Error
}

// Delete удаляет читателя (soft delete)
func (r *readerRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Reader{}, id).Error
}

// GetByEmail находит читателя по email
func (r *readerRepository) GetByEmail(email string) (*models.Reader, error) {
	var reader models.Reader
	err := r.db.Where("email = ?", email).First(&reader).Error
	if err != nil {
		return nil, err
	}
	return &reader, nil
}
