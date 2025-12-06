package handlers_test

import (
	"bytes"
	"encoding/json"
	"errors"
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

// MockCollectionService is a mock for the CollectionService
type MockCollectionService struct {
	mock.Mock
}

func (m *MockCollectionService) CreateCollection(collection *models.Collection) error {
	args := m.Called(collection)
	return args.Error(0)
}

func (m *MockCollectionService) GetCollectionsByUserID(userID uuid.UUID) ([]models.Collection, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Collection), args.Error(1)
}

func (m *MockCollectionService) GetCollectionByID(id uuid.UUID) (*models.Collection, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Collection), args.Error(1)
}

func (m *MockCollectionService) UpdateCollection(collection *models.Collection) error {
	args := m.Called(collection)
	return args.Error(0)
}

func (m *MockCollectionService) DeleteCollection(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockCollectionService) AddBookToCollection(collectionID, bookID uuid.UUID) error {
	args := m.Called(collectionID, bookID)
	return args.Error(0)
}

func (m *MockCollectionService) RemoveBookFromCollection(collectionID, bookID uuid.UUID) error {
	args := m.Called(collectionID, bookID)
	return args.Error(0)
}

func setupTestRouter() (*gin.Engine, *MockCollectionService, *handlers.CollectionHandler) {
	gin.SetMode(gin.TestMode)
	mockService := new(MockCollectionService)
	handler := handlers.NewCollectionHandler(mockService)
	router := gin.New()
	return router, mockService, handler
}

func TestCollectionHandler_CreateCollection(t *testing.T) {
	_, mockService, handler := setupTestRouter()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		dto := models.CreateCollectionDTO{Name: "My Favorites"}

		mockService.On("CreateCollection", mock.AnythingOfType("*models.Collection")).Return(nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Set("userID", userID.String())

		body, _ := json.Marshal(dto)
		c.Request, _ = http.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.CreateCollection(c)

		assert.Equal(t, http.StatusCreated, rr.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("error - binding", func(t *testing.T) {
		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Request, _ = http.NewRequest(http.MethodPost, "/", bytes.NewReader([]byte("{")))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.CreateCollection(c)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

func TestCollectionHandler_GetCollections(t *testing.T) {
	_, mockService, handler := setupTestRouter()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		collections := []models.Collection{{ID: uuid.New(), Name: "Reading List"}}

		mockService.On("GetCollectionsByUserID", userID).Return(collections, nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Set("userID", userID.String())
		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)

		handler.GetCollections(c)

		assert.Equal(t, http.StatusOK, rr.Code)
		var result []models.Collection
		json.Unmarshal(rr.Body.Bytes(), &result)
		assert.Equal(t, collections, result)
		mockService.AssertExpectations(t)
	})
}

func TestCollectionHandler_UpdateCollection(t *testing.T) {
	_, mockService, handler := setupTestRouter()

	t.Run("success", func(t *testing.T) {
		collectionID := uuid.New()
		newName := "New Name"
		dto := models.UpdateCollectionDTO{Name: &newName}
		collection := &models.Collection{ID: collectionID, Name: "Old Name"}

		mockService.On("GetCollectionByID", collectionID).Return(collection, nil).Once()
		mockService.On("UpdateCollection", mock.AnythingOfType("*models.Collection")).Return(nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Params = gin.Params{gin.Param{Key: "id", Value: collectionID.String()}}
		body, _ := json.Marshal(dto)
		c.Request, _ = http.NewRequest(http.MethodPut, "/"+collectionID.String(), bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.UpdateCollection(c)

		assert.Equal(t, http.StatusOK, rr.Code)
		mockService.AssertExpectations(t)
	})
}

func TestCollectionHandler_DeleteCollection(t *testing.T) {
	_, mockService, handler := setupTestRouter()

	t.Run("success", func(t *testing.T) {
		collectionID := uuid.New()

		mockService.On("DeleteCollection", collectionID).Return(nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Params = gin.Params{gin.Param{Key: "id", Value: collectionID.String()}}
		c.Request, _ = http.NewRequest(http.MethodDelete, "/"+collectionID.String(), nil)

		handler.DeleteCollection(c)

		assert.Equal(t, http.StatusOK, rr.Code)
		mockService.AssertExpectations(t)
	})
}

func TestCollectionHandler_AddBookToCollection(t *testing.T) {
	_, mockService, handler := setupTestRouter()

	t.Run("success", func(t *testing.T) {
		collectionID := uuid.New()
		bookID := uuid.New()
		dto := models.AddBookToCollectionDTO{BookID: bookID}

		mockService.On("AddBookToCollection", collectionID, bookID).Return(nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Params = gin.Params{gin.Param{Key: "id", Value: collectionID.String()}}
		body, _ := json.Marshal(dto)
		c.Request, _ = http.NewRequest(http.MethodPost, "/"+collectionID.String()+"/books", bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.AddBookToCollection(c)

		assert.Equal(t, http.StatusOK, rr.Code)
		mockService.AssertExpectations(t)
	})
}

func TestCollectionHandler_RemoveBookFromCollection(t *testing.T) {
	_, mockService, handler := setupTestRouter()

	t.Run("success", func(t *testing.T) {
		collectionID := uuid.New()
		bookID := uuid.New()

		mockService.On("RemoveBookFromCollection", collectionID, bookID).Return(nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Params = gin.Params{
			gin.Param{Key: "id", Value: collectionID.String()},
			gin.Param{Key: "book_id", Value: bookID.String()},
		}
		c.Request, _ = http.NewRequest(http.MethodDelete, "/"+collectionID.String()+"/books/"+bookID.String(), nil)

		handler.RemoveBookFromCollection(c)

		assert.Equal(t, http.StatusOK, rr.Code)
		mockService.AssertExpectations(t)
	})
}

func TestCollectionHandler_GetCollectionByID(t *testing.T) {
	_, mockService, handler := setupTestRouter()

	t.Run("success", func(t *testing.T) {
		collectionID := uuid.New()
		collection := &models.Collection{ID: collectionID, Name: "Sci-Fi"}

		mockService.On("GetCollectionByID", collectionID).Return(collection, nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Params = gin.Params{gin.Param{Key: "id", Value: collectionID.String()}}
		c.Request, _ = http.NewRequest(http.MethodGet, "/"+collectionID.String(), nil)

		handler.GetCollectionByID(c)

		assert.Equal(t, http.StatusOK, rr.Code)
		var result models.Collection
		json.Unmarshal(rr.Body.Bytes(), &result)
		assert.Equal(t, *collection, result)
		mockService.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		collectionID := uuid.New()

		mockService.On("GetCollectionByID", collectionID).Return(nil, errors.New("not found")).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Params = gin.Params{gin.Param{Key: "id", Value: collectionID.String()}}
		c.Request, _ = http.NewRequest(http.MethodGet, "/"+collectionID.String(), nil)

		handler.GetCollectionByID(c)

		assert.Equal(t, http.StatusNotFound, rr.Code)
		mockService.AssertExpectations(t)
	})
}
