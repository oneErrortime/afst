package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin     UserRole = "admin"
	RoleLibrarian UserRole = "librarian"
	RoleReader    UserRole = "reader"
)

type UserGroupType string

const (
	GroupTypeStudent    UserGroupType = "student"
	GroupTypeFree       UserGroupType = "free"
	GroupTypeSubscriber UserGroupType = "subscriber"
)

type User struct {
	ID            uuid.UUID      `json:"id" gorm:"type:text;primary_key"`
	Email         string         `json:"email" gorm:"uniqueIndex;not null" validate:"required,email"`
	Password      string         `json:"-" gorm:"not null" validate:"required,min=6"`
	Name          string         `json:"name" gorm:"not null;default:''"`
	Role          UserRole       `json:"role" gorm:"type:text;not null;default:'reader'"`
	GroupID       *uuid.UUID     `json:"group_id,omitempty" gorm:"type:text"`
	AvatarURL     *string        `json:"avatar_url,omitempty"`
	EmailVerified bool           `json:"email_verified" gorm:"default:false"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	LastLoginAt   *time.Time     `json:"last_login_at,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     *time.Time     `json:"-" gorm:"index"`

	Group         *UserGroup     `json:"group,omitempty" gorm:"foreignKey:GroupID"`
	Roles         []Role         `gorm:"many2many:user_roles;" json:"roles"` // Связь с ролями через UserRole

	Subscriptions []Subscription `json:"-" gorm:"foreignKey:UserID"`
	BookAccesses  []BookAccess   `json:"-" gorm:"foreignKey:UserID"`
}

func (User) TableName() string {
	return "users"
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	if u.Role == "" {
		u.Role = RoleReader
	}
	return nil
}

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

func (u *User) IsLibrarian() bool {
	return u.Role == RoleLibrarian || u.Role == RoleAdmin
}

func (u *User) CanManageBooks() bool {
	return u.Role == RoleAdmin || u.Role == RoleLibrarian
}
