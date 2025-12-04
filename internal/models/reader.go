package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Reader представляет читателя библиотеки
type Reader struct {
	ID        uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	Name      string     `json:"name" gorm:"not null" validate:"required"`
	Email     string     `json:"email" gorm:"uniqueIndex;not null" validate:"required,email"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"-" gorm:"index"` // для soft delete

	// Связи
	BorrowedBooks []BorrowedBook `json:"-" gorm:"foreignKey:ReaderID"`
}

// TableName возвращает имя таблицы для модели Reader
func (Reader) TableName() string {
	return "readers"
}

// BeforeCreate вызывается перед созданием записи
func (r *Reader) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
