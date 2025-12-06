package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type socialRepository struct {
	db *gorm.DB
}

func NewSocialRepository(db *gorm.DB) *socialRepository {
	return &socialRepository{db: db}
}

// Follow создает запись о подписке.
func (r *socialRepository) Follow(userID, targetUserID uuid.UUID) error {
	follow := models.Follow{
		UserID:         userID,
		FollowedUserID: targetUserID,
	}
	return r.db.Create(&follow).Error
}

// Unfollow удаляет запись о подписке.
func (r *socialRepository) Unfollow(userID, targetUserID uuid.UUID) error {
	return r.db.Where("user_id = ? AND followed_user_id = ?", userID, targetUserID).Delete(&models.Follow{}).Error
}

// GetFollowers возвращает список ID пользователей, которые подписаны на targetUserID.
func (r *socialRepository) GetFollowers(targetUserID uuid.UUID) ([]models.User, error) {
	var users []models.User
	err := r.db.Table("users").
		Select("users.*").
		Joins("JOIN follows ON follows.user_id = users.id").
		Where("follows.followed_user_id = ?", targetUserID).
		Find(&users).Error
	return users, err
}

// GetFollowing возвращает список ID пользователей, на которых подписан userID.
func (r *socialRepository) GetFollowing(userID uuid.UUID) ([]models.User, error) {
	var users []models.User
	err := r.db.Table("users").
		Select("users.*").
		Joins("JOIN follows ON follows.followed_user_id = users.id").
		Where("follows.user_id = ?", userID).
		Find(&users).Error
	return users, err
}

// IsFollowing проверяет, подписан ли userID на targetUserID.
func (r *socialRepository) IsFollowing(userID, targetUserID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.Follow{}).
		Where("user_id = ? AND followed_user_id = ?", userID, targetUserID).
		Count(&count).Error
	return count > 0, err
}

// GetUserPublicProfile получает публичные данные пользователя.
func (r *socialRepository) GetUserPublicProfile(userID uuid.UUID) (*models.UserPublicProfileDTO, error) {
	var user models.User
	if err := r.db.First(&user, userID).Error; err != nil {
		return nil, err
	}

	var followerCount, followingCount int64
	r.db.Model(&models.Follow{}).Where("followed_user_id = ?", userID).Count(&followerCount)
	r.db.Model(&models.Follow{}).Where("user_id = ?", userID).Count(&followingCount)

	var collections []models.Collection
	r.db.Where("user_id = ?", userID).Find(&collections)

	var reviews []models.Review
	r.db.Where("user_id = ?", userID).Preload("Book").Find(&reviews)

	profile := &models.UserPublicProfileDTO{
		ID:             user.ID,
		Name:           user.Name,
		FollowerCount:  followerCount,
		FollowingCount: followingCount,
		Collections:    collections,
		Reviews:        reviews,
	}
	return profile, nil
}
