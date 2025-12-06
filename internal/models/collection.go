package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Collection struct {
	ID          uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	UserID      uuid.UUID  `json:"user_id" gorm:"type:text;not null;index"`
	Name        string     `json:"name" gorm:"not null" validate:"required,min=1,max=100"`
	Description *string    `json:"description,omitempty"`
	IsPublic    bool       `json:"is_public" gorm:"default:false"`
	IsSystem    bool       `json:"is_system" gorm:"default:false"`
	SortOrder   int        `json:"sort_order" gorm:"default:0"`
	CoverURL    *string    `json:"cover_url,omitempty"`
	BooksCount  int        `json:"books_count" gorm:"default:0"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"-" gorm:"index"`

	User  *User  `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Books []Book `json:"books,omitempty" gorm:"many2many:collection_books;"`
}

func (Collection) TableName() string {
	return "collections"
}

func (c *Collection) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type CollectionBook struct {
	CollectionID uuid.UUID  `json:"collection_id" gorm:"type:text;primary_key"`
	BookID       uuid.UUID  `json:"book_id" gorm:"type:text;primary_key"`
	AddedAt      time.Time  `json:"added_at"`
	SortOrder    int        `json:"sort_order" gorm:"default:0"`
	Notes        *string    `json:"notes,omitempty"`
	DeletedAt    *time.Time `json:"-" gorm:"index"`

	Collection *Collection `json:"collection,omitempty" gorm:"foreignKey:CollectionID"`
	Book       *Book       `json:"book,omitempty" gorm:"foreignKey:BookID"`
}

func (CollectionBook) TableName() string {
	return "collection_books"
}

type CreateCollectionDTO struct {
	Name        string   `json:"name" validate:"required,min=1,max=100"`
	Description *string  `json:"description,omitempty" validate:"omitempty,max=500"`
	IsPublic    bool     `json:"is_public"`
	CoverURL    *string  `json:"cover_url,omitempty"`
	BookIDs     []string `json:"book_ids,omitempty"`
}

type UpdateCollectionDTO struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=500"`
	IsPublic    *bool   `json:"is_public,omitempty"`
	CoverURL    *string `json:"cover_url,omitempty"`
	SortOrder   *int    `json:"sort_order,omitempty"`
}

type AddBooksToCollectionDTO struct {
	BookIDs []string `json:"book_ids" validate:"required,min=1"`
}
