package services

import (
	"errors"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// bookService реализация BookService
type bookService struct {
	bookRepo repository.BookRepository
}

// NewBookService создает новый экземпляр bookService
func NewBookService(bookRepo repository.BookRepository) BookService {
	return &bookService{
		bookRepo: bookRepo,
	}
}

// CreateBook создает новую книгу
func (s *bookService) CreateBook(dto *models.CreateBookDTO) (*models.Book, error) {
	// Проверяем уникальность ISBN, если он указан
	if dto.ISBN != nil && *dto.ISBN != "" {
		existingBook, err := s.bookRepo.GetByISBN(*dto.ISBN)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		if existingBook != nil {
			return nil, errors.New("книга с таким ISBN уже существует")
		}
	}

	// Создаем книгу
	book := &models.Book{
		Title:           dto.Title,
		Author:          dto.Author,
		PublicationYear: dto.PublicationYear,
		ISBN:            dto.ISBN,
		CopiesCount:     dto.CopiesCount,
		Description:     dto.Description,
	}

	if err := s.bookRepo.Create(book); err != nil {
		return nil, err
	}

	return book, nil
}

// GetBookByID возвращает книгу по ID
func (s *bookService) GetBookByID(id uuid.UUID) (*models.Book, error) {
	book, err := s.bookRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("книга не найдена")
		}
		return nil, err
	}
	return book, nil
}

// GetAllBooks возвращает все книги с пагинацией
func (s *bookService) GetAllBooks(limit, offset int) ([]models.Book, error) {
	// Устанавливаем максимальный лимит для безопасности
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	return s.bookRepo.GetAll(limit, offset)
}

// UpdateBook обновляет книгу
func (s *bookService) UpdateBook(id uuid.UUID, dto *models.UpdateBookDTO) (*models.Book, error) {
	// Проверяем, существует ли книга
	book, err := s.bookRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("книга не найдена")
		}
		return nil, err
	}

	// Проверяем уникальность ISBN, если он изменяется
	if dto.ISBN != nil && *dto.ISBN != "" {
		if book.ISBN == nil || *book.ISBN != *dto.ISBN {
			existingBook, err := s.bookRepo.GetByISBN(*dto.ISBN)
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
			if existingBook != nil && existingBook.ID != id {
				return nil, errors.New("книга с таким ISBN уже существует")
			}
		}
	}

	// Обновляем поля
	if dto.Title != nil {
		book.Title = *dto.Title
	}
	if dto.Author != nil {
		book.Author = *dto.Author
	}
	if dto.PublicationYear != nil {
		book.PublicationYear = dto.PublicationYear
	}
	if dto.ISBN != nil {
		book.ISBN = dto.ISBN
	}
	if dto.CopiesCount != nil {
		book.CopiesCount = *dto.CopiesCount
	}
	if dto.Description != nil {
		book.Description = dto.Description
	}

	if err := s.bookRepo.Update(book); err != nil {
		return nil, err
	}

	return book, nil
}

// DeleteBook удаляет книгу
func (s *bookService) DeleteBook(id uuid.UUID) error {
	// Проверяем, существует ли книга
	_, err := s.bookRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("книга не найдена")
		}
		return err
	}

	return s.bookRepo.Delete(id)
}
