package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/middleware"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

type CollectionHandler struct {
	collectionService services.CollectionService
	validator         *validator.Validate
}

func NewCollectionHandler(collectionService services.CollectionService, validator *validator.Validate) *CollectionHandler {
	return &CollectionHandler{
		collectionService: collectionService,
		validator:         validator,
	}
}

func (h *CollectionHandler) Create(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	var dto models.CreateCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	collection, err := h.collectionService.Create(userID, &dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка создания коллекции", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, collection)
}

func (h *CollectionHandler) GetMyCollections(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	collections, err := h.collectionService.GetMyCollections(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения коллекций", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.ListResponseDTO{Data: collections})
}

func (h *CollectionHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID"})
		return
	}

	collection, err := h.collectionService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Коллекция не найдена"})
		return
	}

	c.JSON(http.StatusOK, collection)
}

func (h *CollectionHandler) Update(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID"})
		return
	}

	var dto models.UpdateCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	collection, err := h.collectionService.Update(id, userID, &dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка обновления коллекции", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, collection)
}

func (h *CollectionHandler) Delete(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID"})
		return
	}

	if err := h.collectionService.Delete(id, userID); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка удаления коллекции", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Коллекция удалена"})
}

func (h *CollectionHandler) AddBooks(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID"})
		return
	}

	var dto models.AddBooksToCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	if err := h.collectionService.AddBooks(id, userID, &dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка добавления книг", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Книги добавлены в коллекцию"})
}

func (h *CollectionHandler) RemoveBook(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	collectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID коллекции"})
		return
	}

	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID книги"})
		return
	}

	if err := h.collectionService.RemoveBook(collectionID, userID, bookID); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка удаления книги", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Книга удалена из коллекции"})
}

func (h *CollectionHandler) GetBooks(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID"})
		return
	}

	books, err := h.collectionService.GetBooks(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка получения книг", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.ListResponseDTO{Data: books})
}

func (h *CollectionHandler) GetPublicCollections(c *gin.Context) {
	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if parsed, err := parseQueryInt(l); err == nil {
			limit = parsed
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsed, err := parseQueryInt(o); err == nil {
			offset = parsed
		}
	}

	collections, err := h.collectionService.GetPublicCollections(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения коллекций", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.ListResponseDTO{Data: collections})
}
