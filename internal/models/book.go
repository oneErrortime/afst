package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookStatus string

const (
	BookStatusDraft     BookStatus = "draft"
	BookStatusPublished BookStatus = "published"
	BookStatusArchived  BookStatus = "archived"
)

type Book struct {
	ID              uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	Title           string     `json:"title" gorm:"not null" validate:"required"`
	Author          string     `json:"author" gorm:"not null" validate:"required"`
	PublicationYear *int       `json:"publication_year,omitempty" validate:"omitempty,gte=0,lte=9999"`
	ISBN            *string    `json:"isbn,omitempty" gorm:"uniqueIndex"`
	CopiesCount     int        `json:"copies_count" gorm:"not null;default:1" validate:"gte=0"`
	Description     *string    `json:"description,omitempty"`
	CoverURL        *string    `json:"cover_url,omitempty"`
	Language        *string    `json:"language,omitempty"`
	PageCount       *int       `json:"page_count,omitempty"`
	Publisher       *string    `json:"publisher,omitempty"`
	Status          BookStatus `json:"status" gorm:"type:text;not null;default:'published'"`
	IsPremium       bool       `json:"is_premium" gorm:"default:false"`
	ViewCount       int        `json:"view_count" gorm:"default:0"`
	DownloadCount   int        `json:"download_count" gorm:"default:0"`
	Rating          float32    `json:"rating" gorm:"default:0"`
	RatingCount     int        `json:"rating_count" gorm:"default:0"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `json:"-" gorm:"index"`

	Categories    []Category     `json:"categories,omitempty" gorm:"many2many:book_categories;"`
	Files         []BookFile     `json:"files,omitempty" gorm:"foreignKey:BookID"`
	BorrowedBooks []BorrowedBook `json:"-" gorm:"foreignKey:BookID"`
	Accesses      []BookAccess   `json:"-" gorm:"foreignKey:BookID"`
}

func (Book) TableName() string {
	return "books"
}

func (b *Book) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	if b.Status == "" {
		b.Status = BookStatusPublished
	}
	return nil
}

func (b *Book) IsAvailable() bool {
	return b.CopiesCount > 0 && b.Status == BookStatusPublished
}

func (b *Book) HasFile() bool {
	return len(b.Files) > 0
}
