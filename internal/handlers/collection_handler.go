package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/middleware"
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

// CreateCollection godoc
// @Summary		Create a new collection
// @Description	Creates a new collection for the authenticated user.
// @Tags			Collections
// @Accept			json
// @Produce		json
// @Security		BearerAuth
// @Param			collection	body		models.CreateCollectionDTO	true	"Collection data"
// @Success		201			{object}	models.Collection
// @Failure		400			{object}	models.ErrorResponseDTO
// @Failure		401			{object}	models.ErrorResponseDTO
// @Failure		500			{object}	models.ErrorResponseDTO
// @Router			/collections [post]
func (h *CollectionHandler) CreateCollection(c *gin.Context) {
	var dto models.CreateCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid request body"})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	collection := &models.Collection{
		UserID:      userID,
		Name:        dto.Name,
		Description: dto.Description,
	}

	if err := h.service.CreateCollection(collection); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, collection)
}

// GetCollections godoc
// @Summary		Get user's collections
// @Description	Retrieves all collections for the authenticated user.
// @Tags			Collections
// @Produce		json
// @Security		BearerAuth
// @Success		200	{array}		models.Collection
// @Failure		401	{object}	models.ErrorResponseDTO
// @Failure		500	{object}	models.ErrorResponseDTO
// @Router			/collections [get]
func (h *CollectionHandler) GetCollections(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Unauthorized"})
		return
	}

	collections, err := h.service.GetCollectionsByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, collections)
}

// GetCollectionByID godoc
// @Summary		Get a collection by ID
// @Description	Retrieves a single collection by its ID.
// @Tags			Collections
// @Produce		json
// @Security		BearerAuth
// @Param			id	path		string	true	"Collection ID"
// @Success		200	{object}	models.Collection
// @Failure		400	{object}	models.ErrorResponseDTO
// @Failure		401	{object}	models.ErrorResponseDTO
// @Failure		404	{object}	models.ErrorResponseDTO
// @Router			/collections/{id} [get]
func (h *CollectionHandler) GetCollectionByID(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid collection ID"})
		return
	}

	collection, err := h.service.GetCollectionByID(collectionID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Collection not found"})
		return
	}

	c.JSON(http.StatusOK, collection)
}

// UpdateCollection godoc
// @Summary		Update a collection
// @Description	Updates a collection's name and/or description.
// @Tags			Collections
// @Accept			json
// @Produce		json
// @Security		BearerAuth
// @Param			id			path		string						true	"Collection ID"
// @Param			collection	body		models.UpdateCollectionDTO	true	"Collection data to update"
// @Success		200			{object}	models.Collection
// @Failure		400			{object}	models.ErrorResponseDTO
// @Failure		401			{object}	models.ErrorResponseDTO
// @Failure		404			{object}	models.ErrorResponseDTO
// @Failure		500			{object}	models.ErrorResponseDTO
// @Router			/collections/{id} [put]
func (h *CollectionHandler) UpdateCollection(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid collection ID"})
		return
	}

	var dto models.UpdateCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid request body"})
		return
	}

	collection, err := h.service.GetCollectionByID(collectionID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Collection not found"})
		return
	}

	// Basic authorization check
	userID, _ := middleware.GetUserFromContext(c)
	if collection.UserID != userID {
		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "You are not authorized to update this collection"})
		return
	}


	if dto.Name != nil {
		collection.Name = *dto.Name
	}
	if dto.Description != nil {
		collection.Description = *dto.Description
	}

	if err := h.service.UpdateCollection(collection); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, collection)
}

// DeleteCollection godoc
// @Summary		Delete a collection
// @Description	Deletes a collection by its ID.
// @Tags			Collections
// @Produce		json
// @Security		BearerAuth
// @Param			id	path		string	true	"Collection ID"
// @Success		200	{object}	models.SuccessResponseDTO
// @Failure		400	{object}	models.ErrorResponseDTO
// @Failure		401	{object}	models.ErrorResponseDTO
// @Failure		404	{object}	models.ErrorResponseDTO
// @Failure		500	{object}	models.ErrorResponseDTO
// @Router			/collections/{id} [delete]
func (h *CollectionHandler) DeleteCollection(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid collection ID"})
		return
	}
	// Basic authorization check
	collection, err := h.service.GetCollectionByID(collectionID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Collection not found"})
		return
	}
	userID, _ := middleware.GetUserFromContext(c)
	if collection.UserID != userID {
		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "You are not authorized to delete this collection"})
		return
	}

	if err := h.service.DeleteCollection(collectionID); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Collection deleted successfully"})
}

// AddBookToCollection godoc
// @Summary		Add a book to a collection
// @Description	Adds a specific book to a specific collection.
// @Tags			Collections
// @Accept			json
// @Produce		json
// @Security		BearerAuth
// @Param			id		path		string							true	"Collection ID"
// @Param			book	body		models.AddBookToCollectionDTO	true	"Book ID to add"
// @Success		200		{object}	models.SuccessResponseDTO
// @Failure		400		{object}	models.ErrorResponseDTO
// @Failure		401		{object}	models.ErrorResponseDTO
// @Failure		404		{object}	models.ErrorResponseDTO
// @Failure		500		{object}	models.ErrorResponseDTO
// @Router			/collections/{id}/books [post]
func (h *CollectionHandler) AddBookToCollection(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid collection ID"})
		return
	}

	// Basic authorization check
	collection, err := h.service.GetCollectionByID(collectionID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Collection not found"})
		return
	}
	userID, _ := middleware.GetUserFromContext(c)
	if collection.UserID != userID {
		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "You are not authorized to modify this collection"})
		return
	}

	var dto models.AddBookToCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid request body"})
		return
	}

	if err := h.service.AddBookToCollection(collectionID, dto.BookID); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Book added to collection successfully"})
}

// RemoveBookFromCollection godoc
// @Summary		Remove a book from a collection
// @Description	Removes a specific book from a specific collection.
// @Tags			Collections
// @Produce		json
// @Security		BearerAuth
// @Param			id		path	string	true	"Collection ID"
// @Param			book_id	path	string	true	"Book ID"
// @Success		200		{object}	models.SuccessResponseDTO
// @Failure		400		{object}	models.ErrorResponseDTO
// @Failure		401		{object}	models.ErrorResponseDTO
// @Failure		404		{object}	models.ErrorResponseDTO
// @Failure		500		{object}	models.ErrorResponseDTO
// @Router			/collections/{id}/books/{book_id} [delete]
func (h *CollectionHandler) RemoveBookFromCollection(c *gin.Context) {
	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid collection ID"})
		return
	}

	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Invalid book ID"})
		return
	}

	// Basic authorization check
	collection, err := h.service.GetCollectionByID(collectionID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Collection not found"})
		return
	}
	userID, _ := middleware.GetUserFromContext(c)
	if collection.UserID != userID {
		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "You are not authorized to modify this collection"})
		return
	}

	if err := h.service.RemoveBookFromCollection(collectionID, bookID); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Book removed from collection successfully"})
}
