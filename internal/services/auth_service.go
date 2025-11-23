package services

import (
	"errors"
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"

	"gorm.io/gorm"
)

// authService реализация AuthService
type authService struct {
	userRepo   repository.UserRepository
	jwtService *auth.JWTService
}

// NewAuthService создает новый экземпляр authService
func NewAuthService(userRepo repository.UserRepository, jwtService *auth.JWTService) AuthService {
	return &authService{
		userRepo:   userRepo,
		jwtService: jwtService,
	}
}

// Register регистрирует нового пользователя (библиотекаря)
func (s *authService) Register(email, password string) (*models.AuthResponseDTO, error) {
	// Проверяем, не существует ли уже пользователь с таким email
	existingUser, err := s.userRepo.GetByEmail(email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("пользователь с таким email уже существует")
	}

	// Хешируем пароль
	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}

	// Создаем пользователя
	user := &models.User{
		Email:    email,
		Password: hashedPassword,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Генерируем JWT токен
	token, err := s.jwtService.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponseDTO{
		Token:   token,
		Message: "Регистрация прошла успешно",
	}, nil
}

// Login выполняет вход пользователя
func (s *authService) Login(email, password string) (*models.AuthResponseDTO, error) {
	// Найти пользователя по email
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("неверный email или пароль")
		}
		return nil, err
	}

	// Проверить пароль
	if !auth.CheckPassword(password, user.Password) {
		return nil, errors.New("неверный email или пароль")
	}

	// Генерировать JWT токен
	token, err := s.jwtService.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponseDTO{
		Token:   token,
		Message: "Вход выполнен успешно",
	}, nil
}
