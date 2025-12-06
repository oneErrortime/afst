package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

// CollectionHandler обрабатывает HTTP-запросы, связанные с коллекциями.
type CollectionHandler struct {
	service services.CollectionService
}

// NewCollectionHandler создает новый экземпляр CollectionHandler.
func NewCollectionHandler(service services.CollectionService) *CollectionHandler {
	return &CollectionHandler{service: service}
}

// CreateCollection создает новую коллекцию.
func (h *CollectionHandler) CreateCollection(c *gin.Context) {
	var dto models.CreateCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	collection := &models.Collection{
		UserID:      uuid.MustParse(userID.(string)),
		Name:        dto.Name,
		Description: dto.Description,
	}

	if err := h.service.CreateCollection(collection); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, collection)
}

// GetCollections получает список коллекций пользователя.
func (h *CollectionHandler) GetCollections(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	collections, err := h.service.GetCollectionsByUserID(uuid.MustParse(userID.(string)))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, collections)
}

// GetCollectionByID получает коллекцию по ID.
func (h *CollectionHandler) GetCollectionByID(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}

	collection, err := h.service.GetCollectionByID(collectionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}

	c.JSON(http.StatusOK, collection)
}

// UpdateCollection обновляет коллекцию.
func (h *CollectionHandler) UpdateCollection(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}

	var dto models.UpdateCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection, err := h.service.GetCollectionByID(collectionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}

	if dto.Name != nil {
		collection.Name = *dto.Name
	}
	if dto.Description != nil {
		collection.Description = *dto.Description
	}

	if err := h.service.UpdateCollection(collection); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, collection)
}

// DeleteCollection удаляет коллекцию.
func (h *CollectionHandler) DeleteCollection(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}

	if err := h.service.DeleteCollection(collectionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Collection deleted successfully"})
}

// AddBookToCollection добавляет книгу в коллекцию.
func (h *CollectionHandler) AddBookToCollection(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}

	var dto models.AddBookToCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AddBookToCollection(collectionID, dto.BookID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book added to collection successfully"})
}

// RemoveBookFromCollection удаляет книгу из коллекции.
func (h *CollectionHandler) RemoveBookFromCollection(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}

	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	if err := h.service.RemoveBookFromCollection(collectionID, bookID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book removed from collection successfully"})
}
