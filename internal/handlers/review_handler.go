package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

// ReviewHandler обрабатывает HTTP-запросы, связанные с отзывами.
type ReviewHandler struct {
	service services.ReviewService
}

// NewReviewHandler создает новый экземпляр ReviewHandler.
func NewReviewHandler(service services.ReviewService) *ReviewHandler {
	return &ReviewHandler{service: service}
}

// CreateReview создает новый отзыв.
func (h *ReviewHandler) CreateReview(c *gin.Context) {
	var dto models.CreateReviewDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	review := &models.Review{
		UserID: uuid.MustParse(userID.(string)),
		BookID: dto.BookID,
		Rating: dto.Rating,
		Title:  dto.Title,
		Body:   dto.Body,
	}

	if err := h.service.CreateReview(review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, review)
}

// GetReviewsByBook получает список отзывов для книги.
func (h *ReviewHandler) GetReviewsByBook(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	reviews, err := h.service.GetReviewsByBookID(bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reviews)
}

// UpdateReview обновляет отзыв.
func (h *ReviewHandler) UpdateReview(c *gin.Context) {
	reviewID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	review, err := h.service.GetReviewByID(reviewID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	if review.UserID.String() != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not the author of this review"})
		return
	}

	var dto models.UpdateReviewDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if dto.Rating != nil {
		review.Rating = *dto.Rating
	}
	if dto.Title != nil {
		review.Title = *dto.Title
	}
	if dto.Body != nil {
		review.Body = *dto.Body
	}

	if err := h.service.UpdateReview(review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, review)
}

// DeleteReview удаляет отзыв.
func (h *ReviewHandler) DeleteReview(c *gin.Context) {
	reviewID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, exists := c.Get("userRole")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	review, err := h.service.GetReviewByID(reviewID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	isAuthor := review.UserID.String() == userID.(string)
	isAdmin := userRole.(models.UserRole) == models.RoleAdmin

	if !isAuthor && !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to delete this review"})
		return
	}

	if err := h.service.DeleteReview(reviewID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted successfully"})
}
