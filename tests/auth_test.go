package tests

import (
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// MockUserRepository для тестирования
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(user *models.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) GetByEmail(email string) (*models.User, error) {
	args := m.Called(email)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) Update(user *models.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestAuthService_Register_Success(t *testing.T) {
	// Arrange
	mockUserRepo := new(MockUserRepository)
	jwtService := auth.NewJWTService("test-secret", time.Hour)
	authService := services.NewAuthService(mockUserRepo, jwtService)

	email := "test@example.com"
	password := "password123"

	// Mock: пользователь не существует
	mockUserRepo.On("GetByEmail", email).Return((*models.User)(nil), gorm.ErrRecordNotFound)
	// Mock: создание пользователя успешно
	mockUserRepo.On("Create", mock.AnythingOfType("*models.User")).Return(nil)

	// Act
	result, err := authService.Register(email, password)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.Token)
	assert.Equal(t, "Регистрация прошла успешно", result.Message)

	mockUserRepo.AssertExpectations(t)
}

func TestAuthService_Register_UserAlreadyExists(t *testing.T) {
	// Arrange
	mockUserRepo := new(MockUserRepository)
	jwtService := auth.NewJWTService("test-secret", time.Hour)
	authService := services.NewAuthService(mockUserRepo, jwtService)

	email := "test@example.com"
	password := "password123"

	existingUser := &models.User{
		ID:    uuid.New(),
		Email: email,
	}

	// Mock: пользователь уже существует
	mockUserRepo.On("GetByEmail", email).Return(existingUser, nil)

	// Act
	result, err := authService.Register(email, password)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "пользователь с таким email уже существует")

	mockUserRepo.AssertExpectations(t)
}

func TestAuthService_Login_Success(t *testing.T) {
	// Arrange
	mockUserRepo := new(MockUserRepository)
	jwtService := auth.NewJWTService("test-secret", time.Hour)
	authService := services.NewAuthService(mockUserRepo, jwtService)

	email := "test@example.com"
	password := "password123"

	hashedPassword, _ := auth.HashPassword(password)
	existingUser := &models.User{
		ID:       uuid.New(),
		Email:    email,
		Password: hashedPassword,
	}

	// Mock: пользователь существует
	mockUserRepo.On("GetByEmail", email).Return(existingUser, nil)

	// Act
	result, err := authService.Login(email, password)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.Token)
	assert.Equal(t, "Вход выполнен успешно", result.Message)

	mockUserRepo.AssertExpectations(t)
}

func TestAuthService_Login_WrongPassword(t *testing.T) {
	// Arrange
	mockUserRepo := new(MockUserRepository)
	jwtService := auth.NewJWTService("test-secret", time.Hour)
	authService := services.NewAuthService(mockUserRepo, jwtService)

	email := "test@example.com"
	password := "password123"
	wrongPassword := "wrongpassword"

	hashedPassword, _ := auth.HashPassword(password)
	existingUser := &models.User{
		ID:       uuid.New(),
		Email:    email,
		Password: hashedPassword,
	}

	// Mock: пользователь существует
	mockUserRepo.On("GetByEmail", email).Return(existingUser, nil)

	// Act
	result, err := authService.Login(email, wrongPassword)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "неверный email или пароль")

	mockUserRepo.AssertExpectations(t)
}

func TestAuthService_Login_UserNotFound(t *testing.T) {
	// Arrange
	mockUserRepo := new(MockUserRepository)
	jwtService := auth.NewJWTService("test-secret", time.Hour)
	authService := services.NewAuthService(mockUserRepo, jwtService)

	email := "nonexistent@example.com"
	password := "password123"

	// Mock: пользователь не найден
	mockUserRepo.On("GetByEmail", email).Return((*models.User)(nil), gorm.ErrRecordNotFound)

	// Act
	result, err := authService.Login(email, password)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "неверный email или пароль")

	mockUserRepo.AssertExpectations(t)
}
