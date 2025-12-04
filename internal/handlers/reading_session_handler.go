package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

type ReadingSessionHandler struct {
	sessionService services.ReadingSessionService
	accessService  services.BookAccessService
	validator      *validator.Validate
}

func NewReadingSessionHandler(
	sessionService services.ReadingSessionService,
	accessService services.BookAccessService,
	validator *validator.Validate,
) *ReadingSessionHandler {
	return &ReadingSessionHandler{
		sessionService: sessionService,
		accessService:  accessService,
		validator:      validator,
	}
}

func (h *ReadingSessionHandler) StartSession(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID пользователя"})
		return
	}

	var req struct {
		BookID   uuid.UUID `json:"book_id" validate:"required"`
		AccessID uuid.UUID `json:"access_id" validate:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	deviceInfo := c.GetHeader("User-Agent")
	session, err := h.sessionService.StartSession(userID, req.BookID, req.AccessID, deviceInfo)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка начала сессии", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, session)
}

func (h *ReadingSessionHandler) EndSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID сессии"})
		return
	}

	var req struct {
		EndPage int `json:"end_page" validate:"required,min=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.sessionService.EndSession(sessionID, req.EndPage); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка завершения сессии", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Сессия завершена"})
}

func (h *ReadingSessionHandler) GetMySessions(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID пользователя"})
		return
	}

	sessions, err := h.sessionService.GetUserSessions(userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения сессий", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.ListResponseDTO{Data: sessions})
}

func (h *ReadingSessionHandler) GetBookStats(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID книги"})
		return
	}

	stats, err := h.sessionService.GetBookStats(bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения статистики", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
