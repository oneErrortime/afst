package handlers

import (
	"github.com/oneErrortime/afst/internal/services"

	"github.com/go-playground/validator/v10"
)

// Handlers объединяет все обработчики
type Handlers struct {
	Auth   *AuthHandler
	Book   *BookHandler
	Reader *ReaderHandler
	Borrow *BorrowHandler
}

// NewHandlers создает новый экземпляр Handlers
func NewHandlers(services *services.Services, validator *validator.Validate) *Handlers {
	return &Handlers{
		Auth:   NewAuthHandler(services.Auth, validator),
		Book:   NewBookHandler(services.Book, validator),
		Reader: NewReaderHandler(services.Reader, validator),
		Borrow: NewBorrowHandler(services.Borrow, validator),
	}
}
