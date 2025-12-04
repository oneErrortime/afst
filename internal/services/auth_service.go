package services

import (
	"errors"

	"github.com/google/uuid"
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
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("неверный email или пароль")
		}
		return nil, err
	}

	if !auth.CheckPassword(password, user.Password) {
		return nil, errors.New("неверный email или пароль")
	}

	token, err := s.jwtService.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponseDTO{
		Token:   token,
		Message: "Вход выполнен успешно",
	}, nil
}

func (s *authService) GetUserByID(id string) (*models.UserResponseDTO, error) {
	userID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("неверный формат ID")
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	return &models.UserResponseDTO{
		ID:            user.ID,
		Email:         user.Email,
		Name:          user.Name,
		Role:          user.Role,
		GroupID:       user.GroupID,
		Group:         user.Group,
		AvatarURL:     user.AvatarURL,
		EmailVerified: user.EmailVerified,
		IsActive:      user.IsActive,
		CreatedAt:     user.CreatedAt,
	}, nil
}

func (s *authService) UpdateUser(id string, dto *models.UpdateUserDTO) (*models.User, error) {
	userID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("неверный формат ID")
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	if dto.Name != nil {
		user.Name = *dto.Name
	}
	if dto.Role != nil {
		user.Role = *dto.Role
	}
	if dto.GroupID != nil {
		user.GroupID = dto.GroupID
	}
	if dto.IsActive != nil {
		user.IsActive = *dto.IsActive
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}
