package gorm

import (
	"github.com/oneErrortime/afst/internal/repository"

	"gorm.io/gorm"
)

// NewRepository создает новый экземпляр Repository с GORM реализациями
func NewRepository(db *gorm.DB) *repository.Repository {
	return &repository.Repository{
		User:         NewUserRepository(db),
		Book:         NewBookRepository(db),
		Reader:       NewReaderRepository(db),
		BorrowedBook: NewBorrowedBookRepository(db),
	}
}
