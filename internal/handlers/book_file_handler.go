package handlers

import (
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/middleware"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
	"github.com/oneErrortime/afst/internal/storage"
)

type BookFileHandler struct {
	fileService   services.BookFileService
	accessService services.BookAccessService
	fileStorage   storage.FileStorage
	validator     *validator.Validate
}

func NewBookFileHandler(
	fileService services.BookFileService,
	accessService services.BookAccessService,
	fileStorage storage.FileStorage,
	validator *validator.Validate,
) *BookFileHandler {
	return &BookFileHandler{
		fileService:   fileService,
		accessService: accessService,
		fileStorage:   fileStorage,
		validator:     validator,
	}
}

func (h *BookFileHandler) Upload(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID книги"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Файл не найден", Message: err.Error()})
		return
	}
	defer file.Close()

	bookFile, err := h.fileService.Upload(bookID, file, header)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка загрузки файла", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, bookFile)
}

func (h *BookFileHandler) GetByBookID(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID книги"})
		return
	}

	files, err := h.fileService.GetByBookID(bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения файлов", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.ListResponseDTO{Data: files})
}

func (h *BookFileHandler) ServeFile(c *gin.Context) {
	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID файла"})
		return
	}

	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}

	bookFile, err := h.fileService.GetByID(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Файл не найден"})
		return
	}

	role, _ := middleware.GetUserRoleFromContext(c)
	hasAccess := false
	if role == models.RoleAdmin || role == models.RoleLibrarian {
		hasAccess = true
	} else {
		hasAccess, _ = h.accessService.CheckAccess(userID, bookFile.BookID)
	}

	if !hasAccess {
		c.JSON(http.StatusForbidden, models.ErrorResponseDTO{Error: "Нет доступа к этой книге"})
		return
	}

	filePath, mimeType, err := h.fileService.ServeFile(fileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения файла", Message: err.Error()})
		return
	}

	file, err := h.fileStorage.Get(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка чтения файла", Message: err.Error()})
		return
	}
	defer file.Close()

	c.Header("Content-Type", mimeType)
	c.Header("Content-Disposition", "inline; filename="+filepath.Base(filePath))
	c.File(file.Name())
}

func (h *BookFileHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат ID"})
		return
	}

	if err := h.fileService.Delete(id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка удаления файла", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponseDTO{Message: "Файл удален"})
}
