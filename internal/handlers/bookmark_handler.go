package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/middleware"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

// BookmarkHandler обрабатывает HTTP-запросы, связанные с закладками.
type BookmarkHandler struct {
	service services.BookmarkService
}

// NewBookmarkHandler создает новый экземпляр BookmarkHandler.
func NewBookmarkHandler(service services.BookmarkService) *BookmarkHandler {
	return &BookmarkHandler{service: service}
}

// CreateBookmark godoc
// @Summary		Create a new bookmark
// @Description	Adds a new bookmark for a book by the authenticated user.
// @Tags			Bookmarks
// @Accept			json
// @Produce		json
// @Security		BearerAuth
// @Param			bookmark	body		models.CreateBookmarkDTO	true	"Bookmark data"
// @Success		201			{object}	models.Bookmark
// @Failure		400			{object}	models.ErrorResponseDTO
// @Failure		401			{object}	models.ErrorResponseDTO
// @Failure		500			{object}	models.ErrorResponseDTO
// @Router			/bookmarks [post]
func (h *BookmarkHandler) CreateBookmark(c *gin.Context) {
	var dto models.CreateBookmarkDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	bookmark := &models.Bookmark{
		UserID:   userID,
		BookID:   dto.BookID,
		Location: dto.Location,
		Label:    dto.Label,
	}

	if err := h.service.CreateBookmark(bookmark); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, bookmark)
}

// GetBookmarksByBook godoc
// @Summary		Get bookmarks for a book
// @Description	Retrieves all bookmarks for a specific book by the authenticated user.
// @Tags			Bookmarks
// @Produce		json
// @Security		BearerAuth
// @Param			book_id	path		string	true	"Book ID"
// @Success		200		{array}		models.Bookmark
// @Failure		400		{object}	models.ErrorResponseDTO
// @Failure		401		{object}	models.ErrorResponseDTO
// @Failure		500		{object}	models.ErrorResponseDTO
// @Router			/bookmarks/book/{book_id} [get]
func (h *BookmarkHandler) GetBookmarksByBook(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid book ID"})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	bookmarks, err := h.service.GetBookmarksByBookID(userID, bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, bookmarks)
}

// GetAllBookmarks godoc
// @Summary		Get all bookmarks
// @Description	Retrieves all bookmarks for the authenticated user (with book details).
// @Tags			Bookmarks
// @Produce		json
// @Security		BearerAuth
// @Success		200		{array}		models.Bookmark
// @Failure		401		{object}	models.ErrorResponseDTO
// @Failure		500		{object}	models.ErrorResponseDTO
// @Router			/bookmarks [get]
func (h *BookmarkHandler) GetAllBookmarks(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	bookmarks, err := h.service.GetAllBookmarks(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, bookmarks)
}

// DeleteBookmark godoc
// @Summary		Delete a bookmark
// @Description	Deletes a bookmark by its ID.
// @Tags			Bookmarks
// @Produce		json
// @Security		BearerAuth
// @Param			id	path		string	true	"Bookmark ID"
// @Success		200	{object}	models.SuccessResponseDTO
// @Failure		400	{object}	models.ErrorResponseDTO
// @Failure		401	{object}	models.ErrorResponseDTO
// @Failure		403	{object}	models.ErrorResponseDTO
// @Failure		404	{object}	models.ErrorResponseDTO
// @Failure		500	{object}	models.ErrorResponseDTO
// @Router			/bookmarks/{id} [delete]
func (h *BookmarkHandler) DeleteBookmark(c *gin.Context) {
	bookmarkID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid bookmark ID"})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	bookmark, err := h.service.GetBookmarkByID(bookmarkID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Bookmark not found"})
		return
	}

	if bookmark.UserID != userID {
		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "You are not the owner of this bookmark"})
		return
	}

	if err := h.service.DeleteBookmark(bookmarkID); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Bookmark deleted successfully"})
}
