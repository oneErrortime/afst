package handlers

import (
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// BorrowHandler обрабатывает запросы для выдачи книг
type BorrowHandler struct {
	borrowService services.BorrowService
	validator     *validator.Validate
}

// NewBorrowHandler создает новый экземпляр BorrowHandler
func NewBorrowHandler(borrowService services.BorrowService, validator *validator.Validate) *BorrowHandler {
	return &BorrowHandler{
		borrowService: borrowService,
		validator:     validator,
	}
}

// BorrowBook выдает книгу читателю
func (h *BorrowHandler) BorrowBook(c *gin.Context) {
	var req models.BorrowBookDTO

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
	borrowedBook, err := h.borrowService.BorrowBook(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Ошибка выдачи книги",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.SuccessResponseDTO{
		Message: "Книга выдана успешно",
		Data:    borrowedBook,
	})
}

// ReturnBook возвращает книгу
func (h *BorrowHandler) ReturnBook(c *gin.Context) {
	var req models.ReturnBookDTO

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
	borrowedBook, err := h.borrowService.ReturnBook(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Ошибка возврата книги",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{
		Message: "Книга возвращена успешно",
		Data:    borrowedBook,
	})
}

// GetBorrowedBooks возвращает все книги, взятые конкретным читателем
func (h *BorrowHandler) GetBorrowedBooks(c *gin.Context) {
	idParam := c.Param("reader_id")
	readerID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный ID читателя",
			Message: "ID должен быть в формате UUID",
		})
		return
	}

	borrowedBooks, err := h.borrowService.GetBorrowedBooksByReader(readerID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{
			Error:   "Ошибка получения выданных книг",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{
		Message: "Выданные книги получены успешно",
		Data:    borrowedBooks,
	})
}
