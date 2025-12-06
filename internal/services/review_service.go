package services

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type reviewService struct {
	repo repository.ReviewRepository
}

func NewReviewService(repo repository.ReviewRepository) ReviewService {
	return &reviewService{repo: repo}
}

func (s *reviewService) CreateReview(review *models.Review) error {
	return s.repo.Create(review)
}

func (s *reviewService) GetReviewsByBookID(bookID uuid.UUID) ([]models.Review, error) {
	return s.repo.GetByBookID(bookID)
}

func (s *reviewService) GetReviewByID(id uuid.UUID) (*models.Review, error) {
	return s.repo.GetByID(id)
}

func (s *reviewService) UpdateReview(review *models.Review) error {
	return s.repo.Update(review)
}

func (s *reviewService) DeleteReview(id uuid.UUID) error {
	return s.repo.Delete(id)
}
