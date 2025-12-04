package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserGroup struct {
	ID          uuid.UUID     `json:"id" gorm:"type:text;primary_key"`
	Name        string        `json:"name" gorm:"not null;uniqueIndex" validate:"required"`
	Type        UserGroupType `json:"type" gorm:"type:text;not null" validate:"required"`
	Description *string       `json:"description,omitempty"`
	Color       *string       `json:"color,omitempty"`
	MaxBooks    int           `json:"max_books" gorm:"not null;default:3"`
	LoanDays    int           `json:"loan_days" gorm:"not null;default:14"`
	CanDownload bool          `json:"can_download" gorm:"default:false"`
	IsActive    bool          `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
	DeletedAt   *time.Time    `json:"-" gorm:"index"`

	Users               []User               `json:"-" gorm:"foreignKey:GroupID"`
	AllowedCategories   []Category           `json:"allowed_categories,omitempty" gorm:"many2many:group_categories;"`
}

func (UserGroup) TableName() string {
	return "user_groups"
}

func (g *UserGroup) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}

type GroupCategory struct {
	GroupID    uuid.UUID `gorm:"type:text;primaryKey"`
	CategoryID uuid.UUID `gorm:"type:text;primaryKey"`
}

func (GroupCategory) TableName() string {
	return "group_categories"
}
