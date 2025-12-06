package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

// CreateBookmark создает новую закладку.
func (h *BookmarkHandler) CreateBookmark(c *gin.Context) {
	var dto models.CreateBookmarkDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	bookmark := &models.Bookmark{
		UserID:   uuid.MustParse(userID.(string)),
		BookID:   dto.BookID,
		Location: dto.Location,
		Label:    dto.Label,
	}

	if err := h.service.CreateBookmark(bookmark); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, bookmark)
}

// GetBookmarksByBook получает список закладок для книги.
func (h *BookmarkHandler) GetBookmarksByBook(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	bookmarks, err := h.service.GetBookmarksByBookID(uuid.MustParse(userID.(string)), bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, bookmarks)
}

// DeleteBookmark удаляет закладку.
func (h *BookmarkHandler) DeleteBookmark(c *gin.Context) {
	bookmarkID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bookmark ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// It's good practice to check ownership before deleting
	bookmark, err := h.service.GetBookmarkByID(bookmarkID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bookmark not found"})
		return
	}

	if bookmark.UserID.String() != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not the owner of this bookmark"})
		return
	}

	if err := h.service.DeleteBookmark(bookmarkID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bookmark deleted successfully"})
}
