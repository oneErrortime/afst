package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/handlers"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockBookmarkService is a mock for the BookmarkService
type MockBookmarkService struct {
	mock.Mock
}

func (m *MockBookmarkService) CreateBookmark(bookmark *models.Bookmark) error {
	args := m.Called(bookmark)
	return args.Error(0)
}

func (m *MockBookmarkService) GetBookmarksByBookID(userID, bookID uuid.UUID) ([]models.Bookmark, error) {
	args := m.Called(userID, bookID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Bookmark), args.Error(1)
}

func (m *MockBookmarkService) GetBookmarkByID(id uuid.UUID) (*models.Bookmark, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Bookmark), args.Error(1)
}

func (m *MockBookmarkService) DeleteBookmark(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func setupBookmarkTestRouter() (*gin.Engine, *MockBookmarkService, *handlers.BookmarkHandler) {
	gin.SetMode(gin.TestMode)
	mockService := new(MockBookmarkService)
	handler := handlers.NewBookmarkHandler(mockService)
	router := gin.New()
	return router, mockService, handler
}

func TestBookmarkHandler_CreateBookmark(t *testing.T) {
	_, mockService, handler := setupBookmarkTestRouter()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		bookID := uuid.New()
		dto := models.CreateBookmarkDTO{BookID: bookID, Location: "10"}

		mockService.On("CreateBookmark", mock.AnythingOfType("*models.Bookmark")).Return(nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Set("userID", userID.String())

		body, _ := json.Marshal(dto)
		c.Request, _ = http.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.CreateBookmark(c)

		assert.Equal(t, http.StatusCreated, rr.Code)
		mockService.AssertExpectations(t)
	})
}

func TestBookmarkHandler_GetBookmarksByBook(t *testing.T) {
	_, mockService, handler := setupBookmarkTestRouter()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		bookID := uuid.New()
		bookmarks := []models.Bookmark{{ID: uuid.New(), UserID: userID, BookID: bookID, Location: "25"}}

		mockService.On("GetBookmarksByBookID", userID, bookID).Return(bookmarks, nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Set("userID", userID.String())
		c.Params = gin.Params{gin.Param{Key: "book_id", Value: bookID.String()}}
		c.Request, _ = http.NewRequest(http.MethodGet, "/book/"+bookID.String(), nil)

		handler.GetBookmarksByBook(c)

		assert.Equal(t, http.StatusOK, rr.Code)
		var result []models.Bookmark
		json.Unmarshal(rr.Body.Bytes(), &result)
		assert.Equal(t, bookmarks, result)
		mockService.AssertExpectations(t)
	})
}

func TestBookmarkHandler_DeleteBookmark(t *testing.T) {
	_, mockService, handler := setupBookmarkTestRouter()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		bookmarkID := uuid.New()
		bookmark := &models.Bookmark{ID: bookmarkID, UserID: userID}

		mockService.On("GetBookmarkByID", bookmarkID).Return(bookmark, nil).Once()
		mockService.On("DeleteBookmark", bookmarkID).Return(nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Set("userID", userID.String())
		c.Params = gin.Params{gin.Param{Key: "id", Value: bookmarkID.String()}}
		c.Request, _ = http.NewRequest(http.MethodDelete, "/"+bookmarkID.String(), nil)

		handler.DeleteBookmark(c)

		assert.Equal(t, http.StatusOK, rr.Code)
		mockService.AssertExpectations(t)
	})
}
