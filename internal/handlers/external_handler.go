package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/middleware"
	"github.com/oneErrortime/afst/internal/models"
)

// ExternalHandler — внешнее API для сторонних разработчиков.
// Все маршруты аутентифицируются через API-ключ (middleware.APIKeyMiddleware).
// Функциональность зеркалирует внутренний API, но с биллингом по токенам.

// ── Books ──────────────────────────────────────────────────────────────────────

// ExtListBooks godoc
// @Summary      [External] Список книг
// @Description  Возвращает список книг с пагинацией. Стоимость: 1 токен.
// @Tags         External API
// @Produce      json
// @Param        X-API-Key  header    string  true  "API-ключ (lk_...)"
// @Param        limit      query     int     false "Лимит (по умолч. 20)"
// @Param        offset     query     int     false "Смещение"
// @Success      200  {array}   models.Book
// @Failure      402  {object}  models.ErrorResponseDTO  "Недостаточно токенов"
// @Failure      401  {object}  models.ErrorResponseDTO
// @Router       /ext/v1/books [get]
func (h *Handlers) ExtListBooks(c *gin.Context) {
	limit := 20
	offset := 0
	if l := c.Query("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}
	if o := c.Query("offset"); o != "" {
		if n, err := strconv.Atoi(o); err == nil && n >= 0 {
			offset = n
		}
	}

	books, err := h.Services.Book.GetAllBooks(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения книг"})
		return
	}
	c.JSON(http.StatusOK, books)
}

// ExtGetBook godoc
// @Summary      [External] Получить книгу по ID
// @Description  Стоимость: 1 токен.
// @Tags         External API
// @Produce      json
// @Param        X-API-Key  header  string  true  "API-ключ"
// @Param        id         path    string  true  "ID книги"
// @Success      200  {object}  models.Book
// @Failure      404  {object}  models.ErrorResponseDTO
// @Router       /ext/v1/books/{id} [get]
func (h *Handlers) ExtGetBook(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный ID книги"})
		return
	}
	book, err := h.Services.Book.GetBookByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponseDTO{Error: "Книга не найдена"})
		return
	}
	c.JSON(http.StatusOK, book)
}

// ── Access / Borrow ───────────────────────────────────────────────────────────

// ExtBorrowBook godoc
// @Summary      [External] Взять книгу
// @Description  Оформляет доступ к книге на 14 дней. Стоимость: 2 токена.
// @Tags         External API
// @Produce      json
// @Param        X-API-Key  header  string  true  "API-ключ"
// @Param        book_id    path    string  true  "ID книги"
// @Success      201  {object}  models.BookAccess
// @Failure      400  {object}  models.ErrorResponseDTO
// @Router       /ext/v1/access/borrow/{book_id} [post]
func (h *Handlers) ExtBorrowBook(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}
	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный ID книги"})
		return
	}
	dto := &models.GrantAccessDTO{
		UserID: userID,
		BookID: bookID,
		Type:   models.AccessTypeLoan,
		Days:   14,
	}
	access, err := h.Services.BookAccess.GrantAccess(dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Ошибка оформления доступа", Message: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, access)
}

// ExtGetLibrary godoc
// @Summary      [External] Моя библиотека
// @Description  Возвращает активные и истёкшие книги пользователя. Стоимость: 1 токен.
// @Tags         External API
// @Produce      json
// @Param        X-API-Key  header  string  true  "API-ключ"
// @Success      200  {object}  models.UserLibraryDTO
// @Router       /ext/v1/access/library [get]
func (h *Handlers) ExtGetLibrary(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}
	library, err := h.Services.BookAccess.GetUserLibrary(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения библиотеки"})
		return
	}
	active := make([]models.BookAccessWithBook, 0)
	expired := make([]models.BookAccessWithBook, 0)
	for _, item := range library {
		if item.IsValid() {
			active = append(active, item)
		} else {
			expired = append(expired, item)
		}
	}
	c.JSON(http.StatusOK, models.UserLibraryDTO{
		ActiveBooks:  active,
		ExpiredBooks: expired,
		TotalBooks:   len(library),
	})
}

// ExtCheckAccess godoc
// @Summary      [External] Проверить доступ к книге
// @Description  Стоимость: 1 токен.
// @Tags         External API
// @Produce      json
// @Param        X-API-Key  header  string  true  "API-ключ"
// @Param        book_id    path    string  true  "ID книги"
// @Success      200  {object}  map[string]bool
// @Router       /ext/v1/access/check/{book_id} [get]
func (h *Handlers) ExtCheckAccess(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}
	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный ID книги"})
		return
	}
	hasAccess, _ := h.Services.BookAccess.CheckAccess(userID, bookID)
	c.JSON(http.StatusOK, gin.H{"has_access": hasAccess})
}

// ── Reviews ───────────────────────────────────────────────────────────────────

// ExtGetReviews godoc
// @Summary      [External] Отзывы на книгу
// @Description  Стоимость: 1 токен.
// @Tags         External API
// @Produce      json
// @Param        X-API-Key  header  string  true  "API-ключ"
// @Param        book_id    path    string  true  "ID книги"
// @Success      200  {array}   models.Review
// @Router       /ext/v1/reviews/book/{book_id} [get]
func (h *Handlers) ExtGetReviews(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный ID книги"})
		return
	}
	reviews, err := h.Services.Review.GetReviewsByBookID(bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения отзывов"})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

// ExtCreateReview godoc
// @Summary      [External] Создать отзыв
// @Description  Стоимость: 2 токена.
// @Tags         External API
// @Accept       json
// @Produce      json
// @Param        X-API-Key  header  string                 true  "API-ключ"
// @Param        body       body    models.CreateReviewDTO true  "Данные отзыва"
// @Success      201  {object}  models.Review
// @Router       /ext/v1/reviews [post]
func (h *Handlers) ExtCreateReview(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}
	var dto models.CreateReviewDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}
	review := &models.Review{
		UserID: userID,
		BookID: dto.BookID,
		Rating: dto.Rating,
		Title:  dto.Title,
		Body:   dto.Body,
	}
	if err := h.Services.Review.CreateReview(review); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка создания отзыва", Message: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, review)
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────

// ExtGetBookmarks godoc
// @Summary      [External] Мои закладки
// @Description  Стоимость: 1 токен.
// @Tags         External API
// @Produce      json
// @Param        X-API-Key  header  string  true  "API-ключ"
// @Success      200  {array}   models.Bookmark
// @Router       /ext/v1/bookmarks [get]
func (h *Handlers) ExtGetBookmarks(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}
	bookmarks, err := h.Services.Bookmark.GetAllBookmarks(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения закладок"})
		return
	}
	c.JSON(http.StatusOK, bookmarks)
}

// ExtCreateBookmark godoc
// @Summary      [External] Создать закладку
// @Description  Стоимость: 2 токена.
// @Tags         External API
// @Accept       json
// @Produce      json
// @Param        X-API-Key  header  string                   true  "API-ключ"
// @Param        body       body    models.CreateBookmarkDTO true  "Данные закладки"
// @Success      201  {object}  models.Bookmark
// @Router       /ext/v1/bookmarks [post]
func (h *Handlers) ExtCreateBookmark(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}
	var dto models.CreateBookmarkDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}
	bookmark := &models.Bookmark{
		UserID:   userID,
		BookID:   dto.BookID,
		Location: dto.Location,
		Label:    dto.Label,
	}
	if err := h.Services.Bookmark.CreateBookmark(bookmark); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка создания закладки", Message: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, bookmark)
}

// ── Collections ───────────────────────────────────────────────────────────────

// ExtGetCollections godoc
// @Summary      [External] Мои коллекции
// @Description  Стоимость: 1 токен.
// @Tags         External API
// @Produce      json
// @Param        X-API-Key  header  string  true  "API-ключ"
// @Success      200  {array}   models.Collection
// @Router       /ext/v1/collections [get]
func (h *Handlers) ExtGetCollections(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}
	cols, err := h.Services.Collection.GetCollectionsByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка получения коллекций"})
		return
	}
	c.JSON(http.StatusOK, cols)
}

// ExtCreateCollection godoc
// @Summary      [External] Создать коллекцию
// @Description  Стоимость: 2 токена.
// @Tags         External API
// @Accept       json
// @Produce      json
// @Param        X-API-Key  header  string                        true  "API-ключ"
// @Param        body       body    models.CreateCollectionDTO    true  "Данные коллекции"
// @Success      201  {object}  models.Collection
// @Router       /ext/v1/collections [post]
func (h *Handlers) ExtCreateCollection(c *gin.Context) {
	userID, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponseDTO{Error: "Не авторизован"})
		return
	}
	var dto models.CreateCollectionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponseDTO{Error: "Неверный формат данных", Message: err.Error()})
		return
	}
	col := &models.Collection{
		UserID:      userID,
		Name:        dto.Name,
		Description: dto.Description,
	}
	if err := h.Services.Collection.CreateCollection(col); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponseDTO{Error: "Ошибка создания коллекции", Message: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, col)
}

