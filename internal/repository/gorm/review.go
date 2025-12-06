package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
	"gorm.io/gorm"
)

type reviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) repository.ReviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) Create(review *models.Review) error {
	return r.db.Create(review).Error
}

func (r *reviewRepository) GetByID(id uuid.UUID) (*models.Review, error) {
	var review models.Review
	err := r.db.Preload("User").Preload("Book").First(&review, "id = ?", id).Error
	return &review, err
}

func (r *reviewRepository) GetByUserAndBook(userID, bookID uuid.UUID) (*models.Review, error) {
	var review models.Review
	err := r.db.Where("user_id = ? AND book_id = ?", userID, bookID).First(&review).Error
	return &review, err
}

func (r *reviewRepository) GetByBook(bookID uuid.UUID, limit, offset int) ([]models.Review, error) {
	var reviews []models.Review
	query := r.db.
		Where("book_id = ? AND is_public = ?", bookID, true).
		Preload("User").
		Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}
	err := query.Find(&reviews).Error
	return reviews, err
}

func (r *reviewRepository) GetByUser(userID uuid.UUID, limit, offset int) ([]models.Review, error) {
	var reviews []models.Review
	query := r.db.Where("user_id = ?", userID).Preload("Book").Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}
	err := query.Find(&reviews).Error
	return reviews, err
}

func (r *reviewRepository) Update(review *models.Review) error {
	return r.db.Save(review).Error
}

func (r *reviewRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Review{}, "id = ?", id).Error
}

func (r *reviewRepository) GetStatistics(bookID uuid.UUID) (*models.ReviewStatisticsDTO, error) {
	stats := &models.ReviewStatisticsDTO{
		BookID: bookID,
	}

	var reviews []models.Review
	err := r.db.Where("book_id = ?", bookID).Find(&reviews).Error
	if err != nil {
		return nil, err
	}

	stats.TotalReviews = len(reviews)
	
	if stats.TotalReviews == 0 {
		return stats, nil
	}

	totalRating := 0
	for _, review := range reviews {
		totalRating += review.Rating
		switch review.Rating {
		case 5:
			stats.Rating5Count++
		case 4:
			stats.Rating4Count++
		case 3:
			stats.Rating3Count++
		case 2:
			stats.Rating2Count++
		case 1:
			stats.Rating1Count++
		}
	}

	stats.AverageRating = float64(totalRating) / float64(stats.TotalReviews)

	return stats, nil
}

func (r *reviewRepository) Count(bookID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Review{}).Where("book_id = ?", bookID).Count(&count).Error
	return count, err
}

func (r *reviewRepository) GetAverageRating(bookID uuid.UUID) (float64, error) {
	stats, err := r.GetStatistics(bookID)
	if err != nil {
		return 0, err
	}
	return stats.AverageRating, nil
}
