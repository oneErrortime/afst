package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

// AuthHandler обрабатывает запросы аутентификации
type AuthHandler struct {
	authService services.AuthService
	validator   *validator.Validate
}

// NewAuthHandler создает новый экземпляр AuthHandler
func NewAuthHandler(authService services.AuthService, validator *validator.Validate) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validator:   validator,
	}
}

// Register обрабатывает регистрацию нового пользователя
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.AuthRequestDTO

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

	// Проверяем что email от Gmail
	if !isGmailAddress(req.Email) {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Недопустимый email",
			Message: "Регистрация доступна только с Gmail адресов (@gmail.com)",
		})
		return
	}

	// Вызываем сервис
	response, err := h.authService.Register(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusConflict, models.ErrorResponseDTO{
			Error:   "Ошибка регистрации",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// Login обрабатывает вход пользователя
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.AuthRequestDTO

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
	response, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
			Error:   "Ошибка входа",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// isGmailAddress проверяет что email является Gmail адресом
func isGmailAddress(email string) bool {
	email = strings.ToLower(strings.TrimSpace(email))
	return strings.HasSuffix(email, "@gmail.com")
}

// GetMe возвращает информацию о текущем пользователе
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
			Error:   "Не авторизован",
			Message: "Требуется авторизация",
		})
		return
	}

	user, err := h.authService.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{
			Error:   "Пользователь не найден",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, user)
}
