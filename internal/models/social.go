package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Follow представляет собой отношение подписки (фолловинга) между двумя пользователями.
type Follow struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;index:idx_user_followed_to" json:"user_id"` // Кто подписался
	User           User      `gorm:"foreignKey:UserID" json:"-"`
	FollowedUserID uuid.UUID `gorm:"type:uuid;not null;index:idx_user_followed_to" json:"followed_user_id"` // На кого подписался
	FollowedUser   User      `gorm:"foreignKey:FollowedUserID" json:"-"`
	CreatedAt      time.Time `json:"created_at"`
}

// BeforeCreate будет вызван перед созданием новой записи
func (f *Follow) BeforeCreate(tx *gorm.DB) (err error) {
	f.ID = uuid.New()
	return
}

// UserPublicProfileDTO представляет публичный профиль пользователя.
type UserPublicProfileDTO struct {
	ID             uuid.UUID    `json:"id"`
	Name           string       `json:"name"`
	FollowerCount  int64        `json:"follower_count"`
	FollowingCount int64        `json:"following_count"`
	Collections    []Collection `json:"collections"`
	Reviews        []Review     `json:"reviews"`
}
