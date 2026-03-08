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

// APIKeyHandler — управление API-ключами пользователя.
type APIKeyHandler struct {
	svc       services.APIKeyService
	validator *validator.Validate
}

func NewAPIKeyHandler(svc services.APIKeyService, v *validator.Validate) *APIKeyHandler {
	return &APIKeyHandler{svc: svc, validator: v}
}

// CreateKey godoc
// @Summary      Создать API-ключ
// @Description  Генерирует новый API-ключ для авторизованного пользователя.
//               Сырой ключ (lk_...) возвращается ТОЛЬКО один раз — сохраните его.
// @Tags         API Keys
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body models.CreateAPIKeyDTO true "Параметры ключа"
// @Success      201  {object}  models.APIKeyCreatedDTO
// @Failure      400  {object}  models.ErrorResponseDTO
// @Failure      401  {object}  models.ErrorResponseDTO
// @Router       /api-keys [post]
func (h *APIKeyHandler) CreateKey(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	var dto models.CreateAPIKeyDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	result, err := h.svc.CreateKey(userID, &dto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка создания ключа", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, result)
}

// ListKeys godoc
// @Summary      Список моих API-ключей
// @Tags         API Keys
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   models.APIKeyResponseDTO
// @Failure      401  {object}  models.ErrorResponseDTO
// @Router       /api-keys [get]
func (h *APIKeyHandler) ListKeys(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	keys, err := h.svc.ListByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения ключей"})
		return
	}

	c.JSON(http.StatusOK, keys)
}

// RevokeKey godoc
// @Summary      Отозвать API-ключ
// @Tags         API Keys
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "ID ключа"
// @Success      200  {object}  models.SuccessResponseDTO
// @Failure      401  {object}  models.ErrorResponseDTO
// @Failure      403  {object}  models.ErrorResponseDTO
// @Failure      404  {object}  models.ErrorResponseDTO
// @Router       /api-keys/{id} [delete]
func (h *APIKeyHandler) RevokeKey(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный ID ключа"})
		return
	}

	if err := h.svc.RevokeKey(keyID, userID); err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "Доступ запрещён"})
			return
		}
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Ключ не найден"})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Ключ отозван"})
}

// GetKeyStats godoc
// @Summary      Статистика использования ключа
// @Tags         API Keys
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "ID ключа"
// @Success      200  {object}  models.APIUsageStatsDTO
// @Failure      401  {object}  models.ErrorResponseDTO
// @Failure      403  {object}  models.ErrorResponseDTO
// @Router       /api-keys/{id}/stats [get]
func (h *APIKeyHandler) GetKeyStats(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный ID ключа"})
		return
	}

	stats, err := h.svc.GetStats(keyID, userID)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "Доступ запрещён"})
			return
		}
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Ключ не найден"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// TopUpTokens godoc
// @Summary      Пополнить баланс токенов (только admin)
// @Tags         API Keys
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string              true  "ID ключа"
// @Param        body body      models.TopUpDTO     true  "Количество токенов"
// @Success      200  {object}  models.SuccessResponseDTO
// @Failure      400  {object}  models.ErrorResponseDTO
// @Failure      401  {object}  models.ErrorResponseDTO
// @Router       /api-keys/{id}/topup [post]
func (h *APIKeyHandler) TopUpTokens(c *gin.Context) {
	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный ID ключа"})
		return
	}

	var dto models.TopUpDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	if err := h.svc.TopUpTokens(keyID, dto.Tokens); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка пополнения", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{
		Message: "Токены добавлены",
		Data:    gin.H{"added": dto.Tokens},
	})
}
