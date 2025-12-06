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

type BookmarkHandler struct {
	bookmarkService services.BookmarkService
	validator       *validator.Validate
}

func NewBookmarkHandler(bookmarkService services.BookmarkService, validator *validator.Validate) *BookmarkHandler {
	return &BookmarkHandler{
		bookmarkService: bookmarkService,
		validator:       validator,
	}
}

func (h *BookmarkHandler) Create(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	var dto models.CreateBookmarkDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	bookmark, err := h.bookmarkService.Create(userID, &dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка создания закладки", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, bookmark)
}

func (h *BookmarkHandler) GetMyBookmarks(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	limit, offset := getPaginationParams(c)

	bookmarks, err := h.bookmarkService.GetMyBookmarks(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения закладок", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.ListResponseDTO{Data: bookmarks})
}

func (h *BookmarkHandler) GetBookBookmarks(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID книги"})
		return
	}

	bookmarks, err := h.bookmarkService.GetBookBookmarks(userID, bookID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка получения закладок", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.ListResponseDTO{Data: bookmarks})
}

func (h *BookmarkHandler) Update(c *gin.Context) {
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

	var dto models.UpdateBookmarkDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	bookmark, err := h.bookmarkService.Update(id, userID, &dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка обновления закладки", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, bookmark)
}

func (h *BookmarkHandler) Delete(c *gin.Context) {
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

	if err := h.bookmarkService.Delete(id, userID); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка удаления закладки", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Закладка удалена"})
}
