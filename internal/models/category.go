package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Category struct {
	ID          uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	Name        string     `json:"name" gorm:"not null;uniqueIndex" validate:"required"`
	Slug        string     `json:"slug" gorm:"uniqueIndex;not null"`
	Description *string    `json:"description,omitempty"`
	Color       *string    `json:"color,omitempty"`
	Icon        *string    `json:"icon,omitempty"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty" gorm:"type:text"`
	SortOrder   int        `json:"sort_order" gorm:"default:0"`
	IsActive    bool       `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"-" gorm:"index"`

	Parent   *Category  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Category `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Books    []Book     `json:"-" gorm:"many2many:book_categories;"`
}

func (Category) TableName() string {
	return "categories"
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type BookCategory struct {
	BookID     uuid.UUID `gorm:"type:text;primaryKey"`
	CategoryID uuid.UUID `gorm:"type:text;primaryKey"`
}

func (BookCategory) TableName() string {
	return "book_categories"
}
