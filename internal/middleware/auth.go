package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

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

		claims, err := jwtService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
				Error:   "Невалидный токен",
				Message: err.Error(),
			})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("user_group_id", claims.GroupID)

		c.Next()
	}
}

func RequireRole(roles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
				Error:   "Не авторизован",
				Message: "Требуется авторизация",
			})
			c.Abort()
			return
		}

		userRole, ok := roleVal.(models.UserRole)
		if !ok {
			c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{
				Error:   "Ошибка сервера",
				Message: "Неверный тип роли пользователя",
			})
			c.Abort()
			return
		}

		for _, role := range roles {
			if userRole == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{
			Error:   "Доступ запрещён",
			Message: "У вас недостаточно прав для выполнения этого действия",
		})
		c.Abort()
	}
}

func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}

func RequireLibrarianOrAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleLibrarian)
}

func RequireAnyRole() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleLibrarian, models.RoleReader)
}

func GetUserFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, errors.New("пользователь не найден в контексте")
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.New("неверный тип ID пользователя")
	}

	return uid, nil
}

func GetUserRoleFromContext(c *gin.Context) (models.UserRole, error) {
	roleVal, exists := c.Get("user_role")
	if !exists {
		return "", errors.New("роль не найдена в контексте")
	}

	role, ok := roleVal.(models.UserRole)
	if !ok {
		return "", errors.New("неверный тип роли")
	}

	return role, nil
}

func GetUserGroupIDFromContext(c *gin.Context) *uuid.UUID {
	groupIDVal, exists := c.Get("user_group_id")
	if !exists {
		return nil
	}

	groupID, ok := groupIDVal.(*uuid.UUID)
	if !ok {
		return nil
	}

	return groupID
}

func FeatureFlagMiddleware(ffs services.FeatureFlagService, flagName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !ffs.IsActive(flagName) {
			c.JSON(http.StatusServiceUnavailable, models.ErrorResponseDTO{
				Error:   "Сервис временно недоступен",
				Message: "Эта функция отключена администратором.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

func MaintenanceMiddleware(ffs services.FeatureFlagService) gin.HandlerFunc {
	return func(c *gin.Context) {
		if ffs.IsActive("maintenance_mode") {
			c.JSON(http.StatusServiceUnavailable, models.ErrorResponseDTO{
				Error:   "Сайт на обслуживании",
				Message: "Мы скоро вернемся. Пожалуйста, попробуйте позже.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
