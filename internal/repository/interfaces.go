package repository

import (
	"github.com/oneErrortime/afst/internal/models"

	"github.com/google/uuid"
)

// UserRepository определяет интерфейс для работы с пользователями
type UserRepository interface {
	Create(user *models.User) error
	GetByEmail(email string) (*models.User, error)
	GetByID(id uuid.UUID) (*models.User, error)
	Update(user *models.User) error
	Delete(id uuid.UUID) error
}

// BookRepository определяет интерфейс для работы с книгами
type BookRepository interface {
	Create(book *models.Book) error
	GetByID(id uuid.UUID) (*models.Book, error)
	GetAll(limit, offset int) ([]models.Book, error)
	Update(book *models.Book) error
	Delete(id uuid.UUID) error
	GetByISBN(isbn string) (*models.Book, error)
}

// ReaderRepository определяет интерфейс для работы с читателями
type ReaderRepository interface {
	Create(reader *models.Reader) error
	GetByID(id uuid.UUID) (*models.Reader, error)
	GetAll(limit, offset int) ([]models.Reader, error)
	Update(reader *models.Reader) error
	Delete(id uuid.UUID) error
	GetByEmail(email string) (*models.Reader, error)
}

// BorrowedBookRepository определяет интерфейс для работы с выданными книгами
type BorrowedBookRepository interface {
	Create(borrowedBook *models.BorrowedBook) error
	GetByID(id uuid.UUID) (*models.BorrowedBook, error)
	GetActiveByReaderID(readerID uuid.UUID) ([]models.BorrowedBook, error)
	GetActiveByBookAndReader(bookID, readerID uuid.UUID) (*models.BorrowedBook, error)
	Update(borrowedBook *models.BorrowedBook) error
	CountActiveByReader(readerID uuid.UUID) (int64, error)
}

// Repository объединяет все репозитории
type Repository struct {
	User         UserRepository
	Book         BookRepository
	Reader       ReaderRepository
	BorrowedBook BorrowedBookRepository
}
