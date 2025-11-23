package handlers

import (
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// ReaderHandler обрабатывает запросы для читателей
type ReaderHandler struct {
	readerService services.ReaderService
	validator     *validator.Validate
}

// NewReaderHandler создает новый экземпляр ReaderHandler
func NewReaderHandler(readerService services.ReaderService, validator *validator.Validate) *ReaderHandler {
	return &ReaderHandler{
		readerService: readerService,
		validator:     validator,
	}
}

// CreateReader создает нового читателя
func (h *ReaderHandler) CreateReader(c *gin.Context) {
	var req models.CreateReaderDTO

	// Парсим JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный формат данных",
			Message: err.Error(),
		})
		return
	}

	// Валидируем данные
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Ошибка валидации",
			Message: err.Error(),
		})
		return
	}

	// Вызываем сервис
	reader, err := h.readerService.CreateReader(&req)
	if err != nil {
		c.JSON(http.StatusConflict, models.ErrorResponseDTO{
			Error:   "Ошибка создания читателя",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.SuccessResponseDTO{
		Message: "Читатель создан успешно",
		Data:    reader,
	})
}

// GetReader возвращает читателя по ID
func (h *ReaderHandler) GetReader(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный ID читателя",
			Message: "ID должен быть в формате UUID",
		})
		return
	}

	reader, err := h.readerService.GetReaderByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{
			Error:   "Читатель не найден",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, reader)
}

// GetAllReaders возвращает всех читателей с пагинацией
func (h *ReaderHandler) GetAllReaders(c *gin.Context) {
	// Парсим параметры пагинации
	limitParam := c.DefaultQuery("limit", "20")
	offsetParam := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitParam)
	if err != nil || limit <= 0 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetParam)
	if err != nil || offset < 0 {
		offset = 0
	}

	readers, err := h.readerService.GetAllReaders(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{
			Error:   "Ошибка получения читателей",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{
		Message: "Читатели получены успешно",
		Data:    readers,
	})
}

// UpdateReader обновляет читателя
func (h *ReaderHandler) UpdateReader(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный ID читателя",
			Message: "ID должен быть в формате UUID",
		})
		return
	}

	var req models.UpdateReaderDTO

	// Парсим JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный формат данных",
			Message: err.Error(),
		})
		return
	}

	// Валидируем данные
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Ошибка валидации",
			Message: err.Error(),
		})
		return
	}

	// Вызываем сервис
	reader, err := h.readerService.UpdateReader(id, &req)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{
			Error:   "Ошибка обновления читателя",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{
		Message: "Читатель обновлён успешно",
		Data:    reader,
	})
}

// DeleteReader удаляет читателя
func (h *ReaderHandler) DeleteReader(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный ID читателя",
			Message: "ID должен быть в формате UUID",
		})
		return
	}

	err = h.readerService.DeleteReader(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{
			Error:   "Ошибка удаления читателя",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{
		Message: "Читатель удалён успешно",
	})
}
