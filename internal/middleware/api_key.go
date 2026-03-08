package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

const (
	APIKeyContextKey    = "api_key"
	APIKeyIDContextKey  = "api_key_id"
	APIKeyUserIDKey     = "api_key_user_id"
)

// APIKeyMiddleware — аутентификация по API-ключу для /ext/v1/*.
// Ключ передаётся через заголовок Authorization: Bearer lk_... или X-API-Key: lk_...
func APIKeyMiddleware(apiKeySvc services.APIKeyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		rawKey := extractAPIKey(c)
		if rawKey == "" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
				Error:   "Требуется API-ключ",
				Message: "Передайте ключ в заголовке 'X-API-Key: lk_...' или 'Authorization: Bearer lk_...'",
			})
			c.Abort()
			return
		}

		// Не JWT-ключи — это внутренние токены (начинаются с "lk_")
		if !strings.HasPrefix(rawKey, "lk_") {
			c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
				Error:   "Неверный формат ключа",
				Message: "API-ключ должен начинаться с 'lk_'. Для входа используйте /api/v1/auth/login",
			})
			c.Abort()
			return
		}

		key, err := apiKeySvc.GetByRawKey(rawKey)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
				Error:   "Неверный или истёкший API-ключ",
				Message: "Проверьте ключ или создайте новый на странице настроек",
			})
			c.Abort()
			return
		}

		// Проверяем баланс токенов
		cost := apiKeySvc.CalcCost(c.Request.Method, c.FullPath())
		if !key.HasTokens(cost) {
			c.JSON(http.StatusPaymentRequired, models.ErrorResponseDTO{
				Error:   "Недостаточно токенов",
				Message: "Пополните баланс токенов на странице API-настроек",
			})
			c.Abort()
			return
		}

		// Кладём данные ключа в контекст
		c.Set(APIKeyContextKey, key)
		c.Set(APIKeyIDContextKey, key.ID)
		c.Set(APIKeyUserIDKey, key.UserID)

		// user_id совместим с GetUserFromContext (используется в handler-ах)
		c.Set("user_id", key.UserID)

		c.Next()

		// После ответа — списываем токены и логируем
		go func() {
			_ = apiKeySvc.ChargeTokens(
				key.ID,
				cost,
				c.FullPath(),
				c.Request.Method,
				c.ClientIP(),
				c.Writer.Status(),
			)
		}()
	}
}

func extractAPIKey(c *gin.Context) string {
	// 1. X-API-Key header
	if key := c.GetHeader("X-API-Key"); key != "" {
		return strings.TrimSpace(key)
	}
	// 2. Authorization: Bearer lk_...
	if auth := c.GetHeader("Authorization"); auth != "" {
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			return strings.TrimSpace(parts[1])
		}
	}
	// 3. Query param ?api_key= (для wget / curl)
	if key := c.Query("api_key"); key != "" {
		return strings.TrimSpace(key)
	}
	return ""
}
