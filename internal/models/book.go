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
	ID              uuid.UUID  `json:"id" gorm:"type:text;primary_key" example:"a8e7e72a-1c7b-4d7a-8f7a-8e7e72a1c7b4"`
	Title           string     `json:"title" gorm:"not null" validate:"required" example:"The Go Programming Language"`
	Author          string     `json:"author" gorm:"not null" validate:"required" example:"Alan A. A. Donovan"`
	PublicationYear *int       `json:"publication_year,omitempty" validate:"omitempty,gte=0,lte=9999" example:"2015"`
	ISBN            *string    `json:"isbn,omitempty" gorm:"uniqueIndex" example:"978-0134190440"`
	CopiesCount     int        `json:"copies_count" gorm:"not null;default:1" validate:"gte=0" example:"10"`
	Description     *string    `json:"description,omitempty" example:"A masterpiece of programming language books."`
	CoverURL        *string    `json:"cover_url,omitempty" example:"https://images.gr-assets.com/books/1435093416l/25132924.jpg"`
	Language        *string    `json:"language,omitempty" example:"English"`
	PageCount       *int       `json:"page_count,omitempty" example:"380"`
	Publisher       *string    `json:"publisher,omitempty" example:"Addison-Wesley Professional"`
	Status          BookStatus `json:"status" gorm:"type:text;not null;default:'published'" example:"published"`
	IsPremium       bool       `json:"is_premium" gorm:"default:false" example:"false"`
	ViewCount       int        `json:"view_count" gorm:"default:0" example:"100"`
	DownloadCount   int        `json:"download_count" gorm:"default:0" example:"50"`
	Rating          float32    `json:"rating" gorm:"default:0" example:"4.5"`
	RatingCount     int        `json:"rating_count" gorm:"default:0" example:"25"`
	CreatedAt       time.Time  `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt       time.Time  `json:"updated_at" example:"2023-01-01T12:00:00Z"`
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
