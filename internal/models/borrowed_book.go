package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BorrowedBook представляет запись о выдаче книги
type BorrowedBook struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	BookID     uuid.UUID  `json:"book_id" gorm:"type:uuid;not null;index"`
	ReaderID   uuid.UUID  `json:"reader_id" gorm:"type:uuid;not null;index"`
	BorrowDate time.Time  `json:"borrow_date" gorm:"not null"`
	ReturnDate *time.Time `json:"return_date,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	DeletedAt  *time.Time `json:"-" gorm:"index"` // для soft delete

	// Связи
	Book   Book   `json:"book,omitempty" gorm:"foreignKey:BookID;references:ID"`
	Reader Reader `json:"reader,omitempty" gorm:"foreignKey:ReaderID;references:ID"`
}

// TableName возвращает имя таблицы для модели BorrowedBook
func (BorrowedBook) TableName() string {
	return "borrowed_books"
}

// BeforeCreate вызывается перед созданием записи
func (bb *BorrowedBook) BeforeCreate(tx *gorm.DB) error {
	if bb.ID == uuid.Nil {
		bb.ID = uuid.New()
	}
	if bb.BorrowDate.IsZero() {
		bb.BorrowDate = time.Now()
	}
	return nil
}

// IsReturned проверяет, возвращена ли книга
func (bb *BorrowedBook) IsReturned() bool {
	return bb.ReturnDate != nil
}

// MarkReturned отмечает книгу как возвращенную
func (bb *BorrowedBook) MarkReturned() {
	now := time.Now()
	bb.ReturnDate = &now
}
