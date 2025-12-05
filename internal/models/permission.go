package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Permission представляет гранулярное право доступа (например, books.create, users.view)
type Permission struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4()" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Name        string         `gorm:"uniqueIndex;not null" json:"name"` // books.create
	Description string         `json:"description"`
}

// Role представляет роль, которая объединяет набор прав
type Role struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4()" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Name        string         `gorm:"uniqueIndex;not null" json:"name"` // admin, librarian, free_user
	Description string         `json:"description"`
	IsSystem    bool           `gorm:"default:false" json:"is_system"` // Системная роль (нельзя удалить)

	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions"`
}

// RolePermission - промежуточная таблица для связи Many-to-Many
type RolePermission struct {
	RoleID       uuid.UUID      `gorm:"type:uuid;primaryKey" json:"role_id"`
	PermissionID uuid.UUID      `gorm:"type:uuid;primaryKey" json:"permission_id"`
	CreatedAt    time.Time      `json:"created_at"`
}

// UserRole - связь пользователя с ролью (пользователь может иметь несколько ролей)
type UserRole struct {
	UserID    uuid.UUID      `gorm:"type:uuid;primaryKey" json:"user_id"`
	RoleID    uuid.UUID      `gorm:"type:uuid;primaryKey" json:"role_id"`
	CreatedAt time.Time      `json:"created_at"`
}
