package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Book представляет книгу в библиотеке
type Book struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Title           string     `json:"title" gorm:"not null" validate:"required"`
	Author          string     `json:"author" gorm:"not null" validate:"required"`
	PublicationYear *int       `json:"publication_year,omitempty" validate:"omitempty,gte=0,lte=9999"`
	ISBN            *string    `json:"isbn,omitempty" gorm:"uniqueIndex"`
	CopiesCount     int        `json:"copies_count" gorm:"not null;default:1" validate:"gte=0"`
	Description     *string    `json:"description,omitempty"` // Поле добавляется во второй миграции
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `json:"-" gorm:"index"` // для soft delete

	// Связи
	BorrowedBooks []BorrowedBook `json:"-" gorm:"foreignKey:BookID"`
}

// TableName возвращает имя таблицы для модели Book
func (Book) TableName() string {
	return "books"
}

// BeforeCreate вызывается перед созданием записи
func (b *Book) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

// IsAvailable проверяет, доступна ли книга для выдачи
func (b *Book) IsAvailable() bool {
	return b.CopiesCount > 0
}
