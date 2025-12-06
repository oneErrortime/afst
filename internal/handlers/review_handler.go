package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/middleware"
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

// CreateReview godoc
// @Summary		Create a new review
// @Description	Adds a new review for a book by the authenticated user.
// @Tags			Reviews
// @Accept			json
// @Produce		json
// @Security		BearerAuth
// @Param			review	body		models.CreateReviewDTO	true	"Review data"
// @Success		201		{object}	models.Review
// @Failure		400		{object}	models.ErrorResponseDTO
// @Failure		401		{object}	models.ErrorResponseDTO
// @Failure		500		{object}	models.ErrorResponseDTO
// @Router			/reviews [post]
func (h *ReviewHandler) CreateReview(c *gin.Context) {
	var dto models.CreateReviewDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	review := &models.Review{
		UserID: userID,
		BookID: dto.BookID,
		Rating: dto.Rating,
		Title:  dto.Title,
		Body:   dto.Body,
	}

	if err := h.service.CreateReview(review); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, review)
}

// GetReviewsByBook godoc
// @Summary		Get reviews for a book
// @Description	Retrieves all reviews for a specific book.
// @Tags			Reviews
// @Produce		json
// @Param			book_id	path		string	true	"Book ID"
// @Success		200		{array}		models.Review
// @Failure		400		{object}	models.ErrorResponseDTO
// @Failure		500		{object}	models.ErrorResponseDTO
// @Router			/reviews/book/{book_id} [get]
func (h *ReviewHandler) GetReviewsByBook(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid book ID"})
		return
	}

	reviews, err := h.service.GetReviewsByBookID(bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, reviews)
}

// UpdateReview godoc
// @Summary		Update a review
// @Description	Updates a review written by the authenticated user.
// @Tags			Reviews
// @Accept			json
// @Produce		json
// @Security		BearerAuth
// @Param			id		path		string					true	"Review ID"
// @Param			review	body		models.UpdateReviewDTO	true	"Review data to update"
// @Success		200		{object}	models.Review
// @Failure		400		{object}	models.ErrorResponseDTO
// @Failure		401		{object}	models.ErrorResponseDTO
// @Failure		403		{object}	models.ErrorResponseDTO
// @Failure		404		{object}	models.ErrorResponseDTO
// @Failure		500		{object}	models.ErrorResponseDTO
// @Router			/reviews/{id} [put]
func (h *ReviewHandler) UpdateReview(c *gin.Context) {
	reviewID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid review ID"})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	review, err := h.service.GetReviewByID(reviewID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Review not found"})
		return
	}

	if review.UserID != userID {
		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "You are not the author of this review"})
		return
	}

	var dto models.UpdateReviewDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: err.Error()})
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
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, review)
}

// DeleteReview godoc
// @Summary		Delete a review
// @Description	Deletes a review by its ID. Can be done by the author or an admin.
// @Tags			Reviews
// @Produce		json
// @Security		BearerAuth
// @Param			id	path		string	true	"Review ID"
// @Success		200	{object}	models.SuccessResponseDTO
// @Failure		400	{object}	models.ErrorResponseDTO
// @Failure		401	{object}	models.ErrorResponseDTO
// @Failure		403	{object}	models.ErrorResponseDTO
// @Failure		404	{object}	models.ErrorResponseDTO
// @Failure		500	{object}	models.ErrorResponseDTO
// @Router			/reviews/{id} [delete]
func (h *ReviewHandler) DeleteReview(c *gin.Context) {
	reviewID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid review ID"})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	userRole, _ := middleware.GetUserRoleFromContext(c)

	review, err := h.service.GetReviewByID(reviewID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Review not found"})
		return
	}

	isAuthor := review.UserID == userID
	isAdmin := userRole == models.RoleAdmin

	if !isAuthor && !isAdmin {
		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "You are not authorized to delete this review"})
		return
	}

	if err := h.service.DeleteReview(reviewID); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Review deleted successfully"})
}
