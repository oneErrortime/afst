package services

import (
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/repository"
)

// NewServices создает новый экземпляр Services
func NewServices(repos *repository.Repository, jwtService *auth.JWTService) *Services {
	return &Services{
		Auth:   NewAuthService(repos.User, jwtService),
		Book:   NewBookService(repos.Book),
		Reader: NewReaderService(repos.Reader),
		Borrow: NewBorrowService(repos.Book, repos.Reader, repos.BorrowedBook),
	}
}
