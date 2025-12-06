package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type ReviewService interface {
	Create(userID uuid.UUID, dto *models.CreateReviewDTO) (*models.Review, error)
	GetByID(id uuid.UUID) (*models.Review, error)
	GetBookReviews(bookID uuid.UUID, limit, offset int) ([]models.Review, error)
	GetMyReviews(userID uuid.UUID, limit, offset int) ([]models.Review, error)
	Update(id, userID uuid.UUID, dto *models.UpdateReviewDTO) (*models.Review, error)
	Delete(id, userID uuid.UUID) error
	GetStatistics(bookID uuid.UUID) (*models.ReviewStatisticsDTO, error)
}

type reviewService struct {
	reviewRepo repository.ReviewRepository
	bookRepo   repository.BookRepository
	accessRepo repository.BookAccessRepository
}

func NewReviewService(
	reviewRepo repository.ReviewRepository,
	bookRepo repository.BookRepository,
	accessRepo repository.BookAccessRepository,
) ReviewService {
	return &reviewService{
		reviewRepo: reviewRepo,
		bookRepo:   bookRepo,
		accessRepo: accessRepo,
	}
}

func (s *reviewService) Create(userID uuid.UUID, dto *models.CreateReviewDTO) (*models.Review, error) {
	_, err := s.bookRepo.GetByID(dto.BookID)
	if err != nil {
		return nil, errors.New("книга не найдена")
	}

	existingReview, _ := s.reviewRepo.GetByUserAndBook(userID, dto.BookID)
	if existingReview != nil {
		return nil, errors.New("вы уже оставили отзыв на эту книгу")
	}

	review := &models.Review{
		UserID:   userID,
		BookID:   dto.BookID,
		Rating:   dto.Rating,
		Title:    dto.Title,
		Content:  dto.Content,
		IsPublic: dto.IsPublic,
	}

	if err := s.reviewRepo.Create(review); err != nil {
		return nil, err
	}

	go s.updateBookRating(dto.BookID)

	return review, nil
}

func (s *reviewService) updateBookRating(bookID uuid.UUID) {
	stats, err := s.reviewRepo.GetStatistics(bookID)
	if err != nil {
		return
	}

	book, err := s.bookRepo.GetByID(bookID)
	if err != nil {
		return
	}

	book.Rating = float32(stats.AverageRating)
	book.RatingCount = stats.TotalReviews

	_ = s.bookRepo.Update(book)
}

func (s *reviewService) GetByID(id uuid.UUID) (*models.Review, error) {
	return s.reviewRepo.GetByID(id)
}

func (s *reviewService) GetBookReviews(bookID uuid.UUID, limit, offset int) ([]models.Review, error) {
	return s.reviewRepo.GetByBook(bookID, limit, offset)
}

func (s *reviewService) GetMyReviews(userID uuid.UUID, limit, offset int) ([]models.Review, error) {
	return s.reviewRepo.GetByUser(userID, limit, offset)
}

func (s *reviewService) Update(id, userID uuid.UUID, dto *models.UpdateReviewDTO) (*models.Review, error) {
	review, err := s.reviewRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("отзыв не найден")
	}

	if review.UserID != userID {
		return nil, errors.New("нет прав на редактирование этого отзыва")
	}

	oldRating := review.Rating

	if dto.Rating != nil {
		review.Rating = *dto.Rating
	}
	if dto.Title != nil {
		review.Title = dto.Title
	}
	if dto.Content != nil {
		review.Content = dto.Content
	}
	if dto.IsPublic != nil {
		review.IsPublic = *dto.IsPublic
	}

	if err := s.reviewRepo.Update(review); err != nil {
		return nil, err
	}

	if dto.Rating != nil && oldRating != *dto.Rating {
		go s.updateBookRating(review.BookID)
	}

	return review, nil
}

func (s *reviewService) Delete(id, userID uuid.UUID) error {
	review, err := s.reviewRepo.GetByID(id)
	if err != nil {
		return errors.New("отзыв не найден")
	}

	if review.UserID != userID {
		return errors.New("нет прав на удаление этого отзыва")
	}

	bookID := review.BookID

	if err := s.reviewRepo.Delete(id); err != nil {
		return err
	}

	go s.updateBookRating(bookID)

	return nil
}

func (s *reviewService) GetStatistics(bookID uuid.UUID) (*models.ReviewStatisticsDTO, error) {
	_, err := s.bookRepo.GetByID(bookID)
	if err != nil {
		return nil, errors.New("книга не найдена")
	}

	return s.reviewRepo.GetStatistics(bookID)
}
