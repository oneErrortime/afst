package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Bookmark struct {
	ID          uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	UserID      uuid.UUID  `json:"user_id" gorm:"type:text;not null;index"`
	BookID      uuid.UUID  `json:"book_id" gorm:"type:text;not null;index"`
	FileID      *uuid.UUID `json:"file_id,omitempty" gorm:"type:text;index"`
	PageNumber  int        `json:"page_number" gorm:"not null" validate:"required,gte=1"`
	Title       *string    `json:"title,omitempty" validate:"omitempty,max=200"`
	Notes       *string    `json:"notes,omitempty"`
	Color       *string    `json:"color,omitempty"`
	IsImportant bool       `json:"is_important" gorm:"default:false"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"-" gorm:"index"`

	User *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Book *Book     `json:"book,omitempty" gorm:"foreignKey:BookID"`
	File *BookFile `json:"file,omitempty" gorm:"foreignKey:FileID"`
}

func (Bookmark) TableName() string {
	return "bookmarks"
}

func (b *Bookmark) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

type CreateBookmarkDTO struct {
	BookID      uuid.UUID  `json:"book_id" validate:"required"`
	FileID      *uuid.UUID `json:"file_id,omitempty"`
	PageNumber  int        `json:"page_number" validate:"required,gte=1"`
	Title       *string    `json:"title,omitempty" validate:"omitempty,max=200"`
	Notes       *string    `json:"notes,omitempty"`
	Color       *string    `json:"color,omitempty" validate:"omitempty,hexcolor"`
	IsImportant bool       `json:"is_important"`
}

type UpdateBookmarkDTO struct {
	PageNumber  *int    `json:"page_number,omitempty" validate:"omitempty,gte=1"`
	Title       *string `json:"title,omitempty" validate:"omitempty,max=200"`
	Notes       *string `json:"notes,omitempty"`
	Color       *string `json:"color,omitempty" validate:"omitempty,hexcolor"`
	IsImportant *bool   `json:"is_important,omitempty"`
}
