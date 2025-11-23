package middleware

import (
	"errors"
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthMiddleware создает middleware для аутентификации JWT
func AuthMiddleware(jwtService *auth.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
				Error:   "Отсутствует токен авторизации",
				Message: "Необходимо предоставить токен в заголовке Authorization",
			})
			c.Abort()
			return
		}

		// Проверяем формат "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
				Error:   "Неверный формат токена",
				Message: "Токен должен быть в формате: Bearer <token>",
			})
			c.Abort()
			return
		}

		token := parts[1]

		// Валидируем токен
		claims, err := jwtService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
				Error:   "Невалидный токен",
				Message: err.Error(),
			})
			c.Abort()
			return
		}

		// Добавляем данные пользователя в контекст
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)

		c.Next()
	}
}

// GetUserFromContext извлекает ID пользователя из контекста Gin
func GetUserFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, gin.Error{Err: errors.New("пользователь не найден в контексте")}
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		return uuid.Nil, gin.Error{Err: errors.New("неверный тип ID пользователя")}
	}

	return uid, nil
}
