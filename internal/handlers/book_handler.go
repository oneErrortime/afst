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

// BookHandler обрабатывает запросы для книг
type BookHandler struct {
	bookService services.BookService
	validator   *validator.Validate
}

// NewBookHandler создает новый экземпляр BookHandler
func NewBookHandler(bookService services.BookService, validator *validator.Validate) *BookHandler {
	return &BookHandler{
		bookService: bookService,
		validator:   validator,
	}
}

// CreateBook godoc
// @Summary Create a new book
// @Description Create a new book
// @Tags books
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param   book_request     body    models.CreateBookDTO     true  "Book Request"
// @Success 201 {object} models.SuccessResponseDTO
// @Failure 400 {object} models.ErrorResponseDTO
// @Failure 409 {object} models.ErrorResponseDTO
// @Router /books [post]
func (h *BookHandler) CreateBook(c *gin.Context) {
	var req models.CreateBookDTO

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
	book, err := h.bookService.CreateBook(&req)
	if err != nil {
		c.JSON(http.StatusConflict, models.ErrorResponseDTO{
			Error:   "Ошибка создания книги",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.SuccessResponseDTO{
		Message: "Книга создана успешно",
		Data:    book,
	})
}

// GetBook godoc
// @Summary Get a book by ID
// @Description Get a single book by its UUID
// @Tags books
// @Produce  json
// @Param id path string true "Book ID"
// @Success 200 {object} models.Book
// @Failure 400 {object} models.ErrorResponseDTO
// @Failure 404 {object} models.ErrorResponseDTO
// @Router /books/{id} [get]
func (h *BookHandler) GetBook(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный ID книги",
			Message: "ID должен быть в формате UUID",
		})
		return
	}

	book, err := h.bookService.GetBookByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{
			Error:   "Книга не найдена",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, book)
}

// GetAllBooks godoc
// @Summary Get all books
// @Description Get a list of all books with pagination
// @Tags books
// @Produce  json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} models.SuccessResponseDTO
// @Failure 500 {object} models.ErrorResponseDTO
// @Router /books [get]
func (h *BookHandler) GetAllBooks(c *gin.Context) {
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

	books, err := h.bookService.GetAllBooks(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{
			Error:   "Ошибка получения книг",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{
		Message: "Книги получены успешно",
		Data:    books,
	})
}

// UpdateBook godoc
// @Summary Update a book
// @Description Update a book's details
// @Tags books
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param id path string true "Book ID"
// @Param   book_update     body    models.UpdateBookDTO     true  "Book Update"
// @Success 200 {object} models.SuccessResponseDTO
// @Failure 400 {object} models.ErrorResponseDTO
// @Failure 404 {object} models.ErrorResponseDTO
// @Router /books/{id} [put]
func (h *BookHandler) UpdateBook(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный ID книги",
			Message: "ID должен быть в формате UUID",
		})
		return
	}

	var req models.UpdateBookDTO

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
	book, err := h.bookService.UpdateBook(id, &req)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{
			Error:   "Ошибка обновления книги",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{
		Message: "Книга обновлена успешно",
		Data:    book,
	})
}

// DeleteBook godoc
// @Summary Delete a book
// @Description Delete a book by its ID
// @Tags books
// @Produce  json
// @Security ApiKeyAuth
// @Param id path string true "Book ID"
// @Success 200 {object} models.SuccessResponseDTO
// @Failure 400 {object} models.ErrorResponseDTO
// @Failure 404 {object} models.ErrorResponseDTO
// @Router /books/{id} [delete]
func (h *BookHandler) DeleteBook(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный ID книги",
			Message: "ID должен быть в формате UUID",
		})
		return
	}

	err = h.bookService.DeleteBook(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{
			Error:   "Ошибка удаления книги",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{
		Message: "Книга удалена успешно",
	})
}
