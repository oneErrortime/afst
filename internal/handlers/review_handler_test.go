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

// MockReviewService is a mock for the ReviewService
type MockReviewService struct {
	mock.Mock
}

func (m *MockReviewService) CreateReview(review *models.Review) error {
	args := m.Called(review)
	return args.Error(0)
}

func (m *MockReviewService) GetReviewsByBookID(bookID uuid.UUID) ([]models.Review, error) {
	args := m.Called(bookID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Review), args.Error(1)
}

func (m *MockReviewService) GetReviewByID(id uuid.UUID) (*models.Review, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Review), args.Error(1)
}

func (m *MockReviewService) UpdateReview(review *models.Review) error {
	args := m.Called(review)
	return args.Error(0)
}

func (m *MockReviewService) DeleteReview(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func setupReviewTestRouter() (*gin.Engine, *MockReviewService, *handlers.ReviewHandler) {
	gin.SetMode(gin.TestMode)
	mockService := new(MockReviewService)
	handler := handlers.NewReviewHandler(mockService)
	router := gin.New()
	return router, mockService, handler
}

func TestReviewHandler_CreateReview(t *testing.T) {
	_, mockService, handler := setupReviewTestRouter()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		bookID := uuid.New()
		dto := models.CreateReviewDTO{BookID: bookID, Rating: 5, Title: "Great book!", Body: "I really enjoyed it."}

		mockService.On("CreateReview", mock.AnythingOfType("*models.Review")).Return(nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Set("userID", userID.String())

		body, _ := json.Marshal(dto)
		c.Request, _ = http.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.CreateReview(c)

		assert.Equal(t, http.StatusCreated, rr.Code)
		mockService.AssertExpectations(t)
	})
}

func TestReviewHandler_GetReviewsByBook(t *testing.T) {
	_, mockService, handler := setupReviewTestRouter()

	t.Run("success", func(t *testing.T) {
		bookID := uuid.New()
		reviews := []models.Review{{ID: uuid.New(), BookID: bookID, Rating: 4}}

		mockService.On("GetReviewsByBookID", bookID).Return(reviews, nil).Once()

		rr := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rr)
		c.Params = gin.Params{gin.Param{Key: "book_id", Value: bookID.String()}}
		c.Request, _ = http.NewRequest(http.MethodGet, "/book/"+bookID.String(), nil)

		handler.GetReviewsByBook(c)

		assert.Equal(t, http.StatusOK, rr.Code)
		var result []models.Review
		json.Unmarshal(rr.Body.Bytes(), &result)
		assert.Equal(t, reviews, result)
		mockService.AssertExpectations(t)
	})
}
