package tests

import (
	"bytes"
	"encoding/json"
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/handlers"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository/gorm"
	"github.com/oneErrortime/afst/internal/services"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	gormdriver "gorm.io/driver/sqlite"
	gormdb "gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type APITestSuite struct {
	suite.Suite
	router     *gin.Engine
	db         *gormdb.DB
	jwtService *auth.JWTService
	testUser   *models.User
	authToken  string
	cleanup    func()
}

func (suite *APITestSuite) SetupSuite() {
	// Настраиваем тестовую базу данных в памяти (SQLite)
	db, err := gormdb.Open(gormdriver.Open(":memory:"), &gormdb.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	suite.Require().NoError(err)

	// Выполняем миграции специально для SQLite
	err = suite.migrateSQLite(db)
	suite.Require().NoError(err)

	suite.db = db

	// Создаем JWT сервис
	suite.jwtService = auth.NewJWTService("test-secret", time.Hour)

	// Создаем репозитории
	repos := gorm.NewRepository(db)

	// Создаем сервисы
	services := services.NewServices(repos, suite.jwtService)

	// Создаем обработчики
	validator := validator.New()
	handlersInstance := handlers.NewHandlers(services, validator)

	// Настраиваем роутер
	gin.SetMode(gin.TestMode)
	suite.router = handlers.SetupRoutes(handlersInstance, suite.jwtService)

	// Создаем тестового пользователя
	suite.createTestUser()
}

func (suite *APITestSuite) TearDownSuite() {
	if suite.cleanup != nil {
		suite.cleanup()
	}
}

// migrateSQLite выполняет миграции для SQLite тестовой базы данных
func (suite *APITestSuite) migrateSQLite(db *gormdb.DB) error {
	// Для тестов используем AutoMigrate, что проще чем адаптировать PostgreSQL миграции
	return db.AutoMigrate(
		&models.User{},
		&models.Book{},
		&models.Reader{},
		&models.BorrowedBook{},
	)
}

func (suite *APITestSuite) createTestUser() {
	// Хешируем пароль
	hashedPassword, err := auth.HashPassword("testpassword")
	suite.Require().NoError(err)

	// Создаем пользователя
	user := &models.User{
		Email:    "test@example.com",
		Password: hashedPassword,
	}

	err = suite.db.Create(user).Error
	suite.Require().NoError(err)

	suite.testUser = user

	// Генерируем токен
	token, err := suite.jwtService.GenerateToken(user.ID, user.Email)
	suite.Require().NoError(err)
	suite.authToken = token
}

func (suite *APITestSuite) makeRequest(method, url string, body interface{}, withAuth bool) *httptest.ResponseRecorder {
	var reqBody *bytes.Buffer
	if body != nil {
		jsonData, _ := json.Marshal(body)
		reqBody = bytes.NewBuffer(jsonData)
	} else {
		reqBody = bytes.NewBuffer(nil)
	}

	req, _ := http.NewRequest(method, url, reqBody)
	req.Header.Set("Content-Type", "application/json")

	if withAuth {
		req.Header.Set("Authorization", "Bearer "+suite.authToken)
	}

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	return w
}

func (suite *APITestSuite) TestAuth_Register_Success() {
	// Arrange
	registerData := models.AuthRequestDTO{
		Email:    "newuser@example.com",
		Password: "password123",
	}

	// Act
	w := suite.makeRequest("POST", "/api/v1/auth/register", registerData, false)

	// Assert
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var response models.AuthResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), response.Token)
	assert.Equal(suite.T(), "Регистрация прошла успешно", response.Message)
}

func (suite *APITestSuite) TestAuth_Register_DuplicateEmail() {
	// Arrange - пытаемся зарегистрировать пользователя с существующим email
	registerData := models.AuthRequestDTO{
		Email:    suite.testUser.Email,
		Password: "password123",
	}

	// Act
	w := suite.makeRequest("POST", "/api/v1/auth/register", registerData, false)

	// Assert
	assert.Equal(suite.T(), http.StatusConflict, w.Code)

	var response models.ErrorResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response.Message, "пользователь с таким email уже существует")
}

func (suite *APITestSuite) TestAuth_Login_Success() {
	// Arrange
	loginData := models.AuthRequestDTO{
		Email:    suite.testUser.Email,
		Password: "testpassword",
	}

	// Act
	w := suite.makeRequest("POST", "/api/v1/auth/login", loginData, false)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response models.AuthResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), response.Token)
	assert.Equal(suite.T(), "Вход выполнен успешно", response.Message)
}

func (suite *APITestSuite) TestAuth_Login_WrongPassword() {
	// Arrange
	loginData := models.AuthRequestDTO{
		Email:    suite.testUser.Email,
		Password: "wrongpassword",
	}

	// Act
	w := suite.makeRequest("POST", "/api/v1/auth/login", loginData, false)

	// Assert
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)

	var response models.ErrorResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response.Message, "неверный email или пароль")
}

func (suite *APITestSuite) TestBooks_CreateBook_WithoutAuth() {
	// Arrange
	bookData := models.CreateBookDTO{
		Title:       "Тестовая книга",
		Author:      "Тестовый автор",
		CopiesCount: 1,
	}

	// Act - пытаемся создать книгу без авторизации
	w := suite.makeRequest("POST", "/api/v1/books", bookData, false)

	// Assert
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)

	var response models.ErrorResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response.Error, "Отсутствует токен авторизации")
}

func (suite *APITestSuite) TestBooks_CreateBook_WithAuth() {
	// Arrange
	bookData := models.CreateBookDTO{
		Title:       "Тестовая книга",
		Author:      "Тестовый автор",
		CopiesCount: 1,
	}

	// Act - создаем книгу с авторизацией
	w := suite.makeRequest("POST", "/api/v1/books", bookData, true)

	// Assert
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var response models.SuccessResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Книга создана успешно", response.Message)
	assert.NotNil(suite.T(), response.Data)
}

func (suite *APITestSuite) TestBooks_GetBooks_Public() {
	// Сначала создаем книгу
	bookData := models.CreateBookDTO{
		Title:       "Публичная книга",
		Author:      "Публичный автор",
		CopiesCount: 1,
	}
	suite.makeRequest("POST", "/api/v1/books", bookData, true)

	// Act - получаем список книг без авторизации (публичный эндпоинт)
	w := suite.makeRequest("GET", "/api/v1/books", nil, false)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response models.SuccessResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Книги получены успешно", response.Message)
	assert.NotNil(suite.T(), response.Data)
}

func (suite *APITestSuite) TestHealth() {
	// Act
	w := suite.makeRequest("GET", "/health", nil, false)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "OK", response["status"])
	assert.Equal(suite.T(), "library-api", response["service"])
}

func TestAPITestSuite(t *testing.T) {
	suite.Run(t, new(APITestSuite))
}
