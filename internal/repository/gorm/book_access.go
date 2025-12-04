package gorm

import (
	"time"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type bookAccessRepository struct {
	db *gorm.DB
}

func NewBookAccessRepository(db *gorm.DB) *bookAccessRepository {
	return &bookAccessRepository{db: db}
}

func (r *bookAccessRepository) Create(access *models.BookAccess) error {
	return r.db.Create(access).Error
}

func (r *bookAccessRepository) GetByID(id uuid.UUID) (*models.BookAccess, error) {
	var access models.BookAccess
	err := r.db.Preload("User").Preload("Book").First(&access, "id = ?", id).Error
	return &access, err
}

func (r *bookAccessRepository) GetByUserID(userID uuid.UUID) ([]models.BookAccess, error) {
	var accesses []models.BookAccess
	err := r.db.Preload("Book").Where("user_id = ?", userID).Order("created_at DESC").Find(&accesses).Error
	return accesses, err
}

func (r *bookAccessRepository) GetActiveByUserID(userID uuid.UUID) ([]models.BookAccess, error) {
	var accesses []models.BookAccess
	err := r.db.Preload("Book").Where("user_id = ? AND status = ? AND end_date > ?", userID, models.AccessStatusActive, time.Now()).Find(&accesses).Error
	return accesses, err
}

func (r *bookAccessRepository) GetByUserAndBook(userID, bookID uuid.UUID) (*models.BookAccess, error) {
	var access models.BookAccess
	err := r.db.Where("user_id = ? AND book_id = ?", userID, bookID).Order("created_at DESC").First(&access).Error
	return &access, err
}

func (r *bookAccessRepository) GetActiveByUserAndBook(userID, bookID uuid.UUID) (*models.BookAccess, error) {
	var access models.BookAccess
	err := r.db.Where("user_id = ? AND book_id = ? AND status = ? AND end_date > ?", userID, bookID, models.AccessStatusActive, time.Now()).First(&access).Error
	return &access, err
}

func (r *bookAccessRepository) Update(access *models.BookAccess) error {
	return r.db.Save(access).Error
}

func (r *bookAccessRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.BookAccess{}, "id = ?", id).Error
}

func (r *bookAccessRepository) CountActiveByUser(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.BookAccess{}).Where("user_id = ? AND status = ? AND end_date > ?", userID, models.AccessStatusActive, time.Now()).Count(&count).Error
	return count, err
}
