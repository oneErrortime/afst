package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User представляет пользователя системы (библиотекаря)
type User struct {
	ID        uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	Email     string     `json:"email" gorm:"uniqueIndex;not null" validate:"required,email"`
	Password  string     `json:"-" gorm:"not null" validate:"required,min=6"` // не возвращается в JSON
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"-" gorm:"index"` // для soft delete
}

// TableName возвращает имя таблицы для модели User
func (User) TableName() string {
	return "users"
}

// BeforeCreate вызывается перед созданием записи
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
