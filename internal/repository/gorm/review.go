package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type reviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) *reviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) Create(review *models.Review) error {
	return r.db.Create(review).Error
}

func (r *reviewRepository) GetByBookID(bookID uuid.UUID) ([]models.Review, error) {
	var reviews []models.Review
	err := r.db.Preload("User").Where("book_id = ?", bookID).Order("created_at DESC").Find(&reviews).Error
	return reviews, err
}

func (r *reviewRepository) GetByID(id uuid.UUID) (*models.Review, error) {
	var review models.Review
	err := r.db.First(&review, "id = ?", id).Error
	return &review, err
}

func (r *reviewRepository) Update(review *models.Review) error {
	return r.db.Save(review).Error
}

func (r *reviewRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Review{}, "id = ?", id).Error
}
