package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/oneErrortime/afst/internal/middleware"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
)

type AuthHandler struct {
	authService services.AuthService
	validator   *validator.Validate
}

func NewAuthHandler(authService services.AuthService, validator *validator.Validate) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validator:   validator,
	}
}

// Register godoc
// @Summary Register a new user
// @Description Register a new user with email and password
// @Tags auth
// @Accept  json
// @Produce  json
// @Param   auth_request     body    models.AuthRequestDTO     true  "Auth Request"
// @Success 201 {object} models.AuthResponseDTO
// @Failure 400 {object} models.ErrorResponseDTO
// @Failure 409 {object} models.ErrorResponseDTO
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
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

	if !isGmailAddress(req.Email) {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Недопустимый email",
			Message: "Регистрация доступна только с Gmail адресов (@gmail.com)",
		})
		return
	}

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

// Login godoc
// @Summary Log in a user
// @Description Log in a user with email and password
// @Tags auth
// @Accept  json
// @Produce  json
// @Param   auth_request     body    models.AuthRequestDTO     true  "Auth Request"
// @Success 200 {object} models.AuthResponseDTO
// @Failure 400 {object} models.ErrorResponseDTO
// @Failure 401 {object} models.ErrorResponseDTO
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
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

func isGmailAddress(email string) bool {
	email = strings.ToLower(strings.TrimSpace(email))
	return strings.HasSuffix(email, "@gmail.com")
}

// GetMe godoc
// @Summary Get the current user
// @Description Get the current user's profile
// @Tags auth
// @Produce  json
// @Security ApiKeyAuth
// @Success 200 {object} models.UserResponseDTO
// @Failure 401 {object} models.ErrorResponseDTO
// @Failure 404 {object} models.ErrorResponseDTO
// @Router /auth/me [get]
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{
			Error:   "Не авторизован",
			Message: "Требуется авторизация",
		})
		return
	}

	user, err := h.authService.GetUserByID(userID.String())
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{
			Error:   "Пользователь не найден",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ListUsers godoc
// @Summary List all users
// @Description Get a list of all users with pagination
// @Tags users
// @Produce  json
// @Security ApiKeyAuth
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} models.ListResponseDTO
// @Failure 500 {object} models.ErrorResponseDTO
// @Router /users [get]
func (h *AuthHandler) ListUsers(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 100 {
		limit = 100
	}

	users, total, err := h.authService.ListUsers(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{
			Error:   "Ошибка получения пользователей",
			Message: err.Error(),
		})
		return
	}

	page := offset/limit + 1
	lastPage := int(total) / limit
	if int(total)%limit != 0 {
		lastPage++
	}

	c.JSON(http.StatusOK, models.ListResponseDTO{
		Data: users,
		Pagination: &models.PaginationDTO{
			Page:     page,
			Limit:    limit,
			Total:    total,
			LastPage: lastPage,
		},
	})
}

// UpdateUserByAdmin godoc
// @Summary Update a user by admin
// @Description Update a user's details by an admin
// @Tags users
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Param   user_update     body    models.UpdateUserDTO     true  "User Update"
// @Success 200 {object} models.UserResponseDTO
// @Failure 400 {object} models.ErrorResponseDTO
// @Failure 500 {object} models.ErrorResponseDTO
// @Router /users/{id} [put]
func (h *AuthHandler) UpdateUserByAdmin(c *gin.Context) {
	userID := c.Param("id")
	
	var dto models.UpdateUserDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{
			Error:   "Неверный формат данных",
			Message: err.Error(),
		})
		return
	}

	user, err := h.authService.UpdateUser(userID, &dto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{
			Error:   "Ошибка обновления пользователя",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

type CreateAdminRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Name     string `json:"name" validate:"required"`
}

// CreateAdmin godoc
// @Summary Create a new admin user
// @Description Create a new admin user
// @Tags users
// @Accept  json
// @Produce  json
// @Security ApiKeyAuth
// @Param   admin_request     body    CreateAdminRequest     true  "Admin Request"
// @Success 201 {object} models.UserResponseDTO
// @Failure 400 {object} models.ErrorResponseDTO
// @Failure 409 {object} models.ErrorResponseDTO
// @Router /users/admin [post]
func (h *AuthHandler) CreateAdmin(c *gin.Context) {
	var req CreateAdminRequest
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
