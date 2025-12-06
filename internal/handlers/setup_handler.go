package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

type SetupHandler struct {
	authService services.AuthService
	validator   *validator.Validate
}

func NewSetupHandler(authService services.AuthService, validator *validator.Validate) *SetupHandler {
	return &SetupHandler{
		authService: authService,
		validator:   validator,
	}
}

func (h *SetupHandler) GetStatus(c *gin.Context) {
	hasAdmin, err := h.authService.HasAdminAccount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{
			Error:   "Ошибка проверки статуса настройки",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"setup_needed": !hasAdmin})
}

func (h *SetupHandler) CreateAdmin(c *gin.Context) {
	hasAdmin, err := h.authService.HasAdminAccount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{
			Error:   "Ошибка проверки статуса настройки",
			Message: err.Error(),
		})
		return
	}

	if hasAdmin {
		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{
			Error:   "Настройка уже завершена",
			Message: "Администратор уже существует.",
		})
		return
	}

	var req models.AuthRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный формат данных",
			Message: err.Error(),
		})
		return
	}

	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Ошибка валидации",
			Message: err.Error(),
		})
		return
	}

	user, err := h.authService.CreateAdmin(req.Email, req.Password, req.Name)
	if err != nil {
		c.JSON(http.StatusConflict, models.ErrorResponseDTO{
			Error:   "Ошибка создания администратора",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.UserResponseDTO{
		ID:       user.ID,
		Email:    user.Email,
		Name:     user.Name,
		Role:     user.Role,
		IsActive: user.IsActive,
	})
}
