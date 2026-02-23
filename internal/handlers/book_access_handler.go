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

type BookAccessHandler struct {
	accessService services.BookAccessService
	validator     *validator.Validate
}

func NewBookAccessHandler(accessService services.BookAccessService, validator *validator.Validate) *BookAccessHandler {
	return &BookAccessHandler{
		accessService: accessService,
		validator:     validator,
	}
}

func (h *BookAccessHandler) GrantAccess(c *gin.Context) {
	var dto models.GrantAccessDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	access, err := h.accessService.GrantAccess(&dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка выдачи доступа", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, access)
}

func (h *BookAccessHandler) GetMyLibrary(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	library, err := h.accessService.GetUserLibrary(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения библиотеки", Message: err.Error()})
		return
	}

	active := make([]models.BookAccessWithBook, 0)
	expired := make([]models.BookAccessWithBook, 0)
	for _, item := range library {
		if item.IsValid() {
			active = append(active, item)
		} else {
			expired = append(expired, item)
		}
	}

	c.JSON(http.StatusOK, models.UserLibraryDTO{
		ActiveBooks:  active,
		ExpiredBooks: expired,
		TotalBooks:   len(library),
	})
}

func (h *BookAccessHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID"})
		return
	}

	access, err := h.accessService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Доступ не найден"})
		return
	}

	c.JSON(http.StatusOK, access)
}

func (h *BookAccessHandler) CheckAccess(c *gin.Context) {
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

	hasAccess, err := h.accessService.CheckAccess(userID, bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка проверки доступа", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"has_access": hasAccess})
}

func (h *BookAccessHandler) BorrowBook(c *gin.Context) {
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

	dto := &models.GrantAccessDTO{
		UserID: userID,
		BookID: bookID,
		Type:   models.AccessTypeLoan,
		Days:   14,
	}

	access, err := h.accessService.GrantAccess(dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка оформления аренды", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, access)
}

func (h *BookAccessHandler) RevokeAccess(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID"})
		return
	}

	if err := h.accessService.RevokeAccess(id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка отзыва доступа", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Доступ отозван"})
}

func (h *BookAccessHandler) UpdateProgress(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID"})
		return
	}

	var dto models.UpdateReadingProgressDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.accessService.UpdateProgress(id, dto.CurrentPage, 0); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка обновления прогресса", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Прогресс обновлен"})
}
