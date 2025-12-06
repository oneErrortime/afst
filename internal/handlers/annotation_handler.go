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

type AnnotationHandler struct {
	annotationService services.AnnotationService
	validator         *validator.Validate
}

func NewAnnotationHandler(annotationService services.AnnotationService, validator *validator.Validate) *AnnotationHandler {
	return &AnnotationHandler{
		annotationService: annotationService,
		validator:         validator,
	}
}

func (h *AnnotationHandler) Create(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	var dto models.CreateAnnotationDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	annotation, err := h.annotationService.Create(userID, &dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка создания аннотации", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, annotation)
}

func (h *AnnotationHandler) GetBookAnnotations(c *gin.Context) {
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

	includePublic := c.Query("include_public") == "true"

	annotations, err := h.annotationService.GetBookAnnotations(userID, bookID, includePublic)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка получения аннотаций", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.ListResponseDTO{Data: annotations})
}

func (h *AnnotationHandler) Update(c *gin.Context) {
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

	var dto models.UpdateAnnotationDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}

	if err := h.validator.Struct(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка валидации", Message: err.Error()})
		return
	}

	annotation, err := h.annotationService.Update(id, userID, &dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка обновления аннотации", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, annotation)
}

func (h *AnnotationHandler) Delete(c *gin.Context) {
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

	if err := h.annotationService.Delete(id, userID); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка удаления аннотации", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Аннотация удалена"})
}
