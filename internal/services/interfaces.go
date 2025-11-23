package services

import (
	"github.com/oneErrortime/afst/internal/models"

	"github.com/google/uuid"
)

// AuthService определяет интерфейс для аутентификации
type AuthService interface {
	Register(email, password string) (*models.AuthResponseDTO, error)
	Login(email, password string) (*models.AuthResponseDTO, error)
}

// BookService определяет интерфейс для управления книгами
type BookService interface {
	CreateBook(dto *models.CreateBookDTO) (*models.Book, error)
	GetBookByID(id uuid.UUID) (*models.Book, error)
	GetAllBooks(limit, offset int) ([]models.Book, error)
	UpdateBook(id uuid.UUID, dto *models.UpdateBookDTO) (*models.Book, error)
	DeleteBook(id uuid.UUID) error
}

// ReaderService определяет интерфейс для управления читателями
type ReaderService interface {
	CreateReader(dto *models.CreateReaderDTO) (*models.Reader, error)
	GetReaderByID(id uuid.UUID) (*models.Reader, error)
	GetAllReaders(limit, offset int) ([]models.Reader, error)
	UpdateReader(id uuid.UUID, dto *models.UpdateReaderDTO) (*models.Reader, error)
	DeleteReader(id uuid.UUID) error
}

// BorrowService определяет интерфейс для управления выдачей книг
type BorrowService interface {
	BorrowBook(dto *models.BorrowBookDTO) (*models.BorrowedBook, error)
	ReturnBook(dto *models.ReturnBookDTO) (*models.BorrowedBook, error)
	GetBorrowedBooksByReader(readerID uuid.UUID) ([]models.BorrowedBook, error)
}

// Services объединяет все сервисы
type Services struct {
	Auth   AuthService
	Book   BookService
	Reader ReaderService
	Borrow BorrowService
}
