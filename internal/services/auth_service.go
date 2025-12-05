package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
	"gorm.io/gorm"
)

type authService struct {
	userRepo   repository.UserRepository
	groupRepo  repository.UserGroupRepository
	jwtService *auth.JWTService
}

func NewAuthService(userRepo repository.UserRepository, groupRepo repository.UserGroupRepository, jwtService *auth.JWTService) AuthService {
	return &authService{
		userRepo:   userRepo,
		groupRepo:  groupRepo,
		jwtService: jwtService,
	}
}

func (s *authService) Register(email, password string) (*models.AuthResponseDTO, error) {
	existingUser, err := s.userRepo.GetByEmail(email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("пользователь с таким email уже существует")
	}

	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}

	var freeGroup *models.UserGroup
	if s.groupRepo != nil {
		// Использование GetByType более эффективно, чем List(10, 0) + цикл
		groups, err := s.groupRepo.GetByType(models.GroupTypeFree)
		if err == nil && len(groups) > 0 {
			freeGroup = &groups[0]
		}
	}

	user := &models.User{
		Email:    email,
		Password: hashedPassword,
		Role:     models.RoleReader,
		IsActive: true,
	}

	if freeGroup != nil {
		user.GroupID = &freeGroup.ID
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	token, err := s.jwtService.GenerateToken(user.ID, user.Email, user.Role, user.GroupID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponseDTO{
		Token:   token,
		Message: "Регистрация прошла успешно",
		User:    user,
	}, nil
}

func (s *authService) Login(email, password string) (*models.AuthResponseDTO, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("неверный email или пароль")
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, errors.New("аккаунт деактивирован")
	}

	if !auth.CheckPassword(password, user.Password) {
		return nil, errors.New("неверный email или пароль")
	}

	token, err := s.jwtService.GenerateToken(user.ID, user.Email, user.Role, user.GroupID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponseDTO{
		Token:   token,
		Message: "Вход выполнен успешно",
		User:    user,
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

func (s *authService) ListUsers(limit, offset int) ([]models.User, int64, error) {
	users, err := s.userRepo.List(limit, offset)
	if err != nil {
		return nil, 0, err
	}
	count, err := s.userRepo.Count()
	if err != nil {
		return nil, 0, err
	}
	return users, count, nil
}

func (s *authService) CreateAdmin(email, password, name string) (*models.User, error) {
	existingUser, err := s.userRepo.GetByEmail(email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("пользователь с таким email уже существует")
	}

	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:    email,
		Password: hashedPassword,
		Name:     name,
		Role:     models.RoleAdmin,
		IsActive: true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}
