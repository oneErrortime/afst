package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Register(email, password string) (*models.AuthResponseDTO, error) {
	args := m.Called(email, password)
	return args.Get(0).(*models.AuthResponseDTO), args.Error(1)
}
func (m *MockAuthService) Login(email, password string) (*models.AuthResponseDTO, error) {
	args := m.Called(email, password)
	return args.Get(0).(*models.AuthResponseDTO), args.Error(1)
}
func (m *MockAuthService) GetUserByID(id string) (*models.UserResponseDTO, error) {
	args := m.Called(id)
	return args.Get(0).(*models.UserResponseDTO), args.Error(1)
}
func (m *MockAuthService) UpdateUser(id string, dto *models.UpdateUserDTO) (*models.User, error) {
	args := m.Called(id, dto)
	return args.Get(0).(*models.User), args.Error(1)
}
func (m *MockAuthService) ListUsers(limit, offset int) ([]models.User, int64, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]models.User), int64(args.Int(1)), args.Error(2)
}
func (m *MockAuthService) CreateAdmin(email, password, name string) (*models.User, error) {
	args := m.Called(email, password, name)
	return args.Get(0).(*models.User), args.Error(1)
}
func (m *MockAuthService) HasAdminAccount() (bool, error) {
	args := m.Called()
	return args.Bool(0), args.Error(1)
}

func TestSetupHandler_GetStatus_NoAdmin(t *testing.T) {
	mockAuthService := new(MockAuthService)
	mockAuthService.On("HasAdminAccount").Return(false, nil)

	handler := NewSetupHandler(mockAuthService, validator.New())

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	handler.GetStatus(c)

	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]bool
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.True(t, response["setup_needed"])
}

func TestSetupHandler_GetStatus_AdminExists(t *testing.T) {
	mockAuthService := new(MockAuthService)
	mockAuthService.On("HasAdminAccount").Return(true, nil)

	handler := NewSetupHandler(mockAuthService, validator.New())

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	handler.GetStatus(c)

	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]bool
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.False(t, response["setup_needed"])
}

func TestSetupHandler_CreateAdmin_Success(t *testing.T) {
	mockAuthService := new(MockAuthService)
	mockAuthService.On("HasAdminAccount").Return(false, nil)
	mockAuthService.On("CreateAdmin", "admin@test.com", "password", "Admin").Return(&models.User{Email: "admin@test.com"}, nil)

	handler := NewSetupHandler(mockAuthService, validator.New())

	body := `{"email": "admin@test.com", "password": "password", "name": "Admin"}`
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateAdmin(c)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestSetupHandler_CreateAdmin_AdminExists(t *testing.T) {
	mockAuthService := new(MockAuthService)
	mockAuthService.On("HasAdminAccount").Return(true, nil)

	handler := NewSetupHandler(mockAuthService, validator.New())

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	handler.CreateAdmin(c)

	assert.Equal(t, http.StatusForbidden, w.Code)
}
