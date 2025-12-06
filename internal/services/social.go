package services

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
)

// SocialRepository определяет методы для работы с социальными функциями в хранилище.
type SocialRepository interface {
	Follow(userID, targetUserID uuid.UUID) error
	Unfollow(userID, targetUserID uuid.UUID) error
	GetFollowers(targetUserID uuid.UUID) ([]models.User, error)
	GetFollowing(userID uuid.UUID) ([]models.User, error)
	IsFollowing(userID, targetUserID uuid.UUID) (bool, error)
	GetUserPublicProfile(userID uuid.UUID) (*models.UserPublicProfileDTO, error)
}

type socialService struct {
	repo SocialRepository
}

func NewSocialService(repo SocialRepository) SocialService {
	return &socialService{repo: repo}
}

func (s *socialService) FollowUser(userID, targetUserID uuid.UUID) error {
	// Можно добавить проверки: не подписывается ли на себя, не заблокирован ли пользователь и т.д.
	return s.repo.Follow(userID, targetUserID)
}

func (s *socialService) UnfollowUser(userID, targetUserID uuid.UUID) error {
	return s.repo.Unfollow(userID, targetUserID)
}

func (s *socialService) GetUserProfile(userID uuid.UUID) (*models.UserPublicProfileDTO, error) {
	return s.repo.GetUserPublicProfile(userID)
}
