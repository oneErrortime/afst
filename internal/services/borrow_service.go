package services

import (
	"errors"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// borrowService реализация BorrowService
type borrowService struct {
	bookRepo         repository.BookRepository
	readerRepo       repository.ReaderRepository
	borrowedBookRepo repository.BorrowedBookRepository
}

// NewBorrowService создает новый экземпляр borrowService
func NewBorrowService(
	bookRepo repository.BookRepository,
	readerRepo repository.ReaderRepository,
	borrowedBookRepo repository.BorrowedBookRepository,
) BorrowService {
	return &borrowService{
		bookRepo:         bookRepo,
		readerRepo:       readerRepo,
		borrowedBookRepo: borrowedBookRepo,
	}
}

// BorrowBook выдает книгу читателю
func (s *borrowService) BorrowBook(dto *models.BorrowBookDTO) (*models.BorrowedBook, error) {
	// Проверяем существование книги
	book, err := s.bookRepo.GetByID(dto.BookID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("книга не найдена")
		}
		return nil, err
	}

	// Проверяем существование читателя
	reader, err := s.readerRepo.GetByID(dto.ReaderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("читатель не найден")
		}
		return nil, err
	}

	// Бизнес-правило 1: Проверяем наличие экземпляров книги
	if book.CopiesCount <= 0 {
		return nil, errors.New("нет доступных экземпляров книги")
	}

	// Бизнес-правило 2: Проверяем, что читатель не взял уже более 3 книг
	activeBorrowsCount, err := s.borrowedBookRepo.CountActiveByReader(dto.ReaderID)
	if err != nil {
		return nil, err
	}
	if activeBorrowsCount >= 3 {
		return nil, errors.New("читатель уже взял максимальное количество книг (3)")
	}

	// Проверяем, что этот читатель ещё не взял эту конкретную книгу
	existingBorrow, err := s.borrowedBookRepo.GetActiveByBookAndReader(dto.BookID, dto.ReaderID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existingBorrow != nil {
		return nil, errors.New("читатель уже взял эту книгу")
	}

	// Создаем запись о выдаче
	borrowedBook := &models.BorrowedBook{
		BookID:   dto.BookID,
		ReaderID: dto.ReaderID,
		Book:     *book,
		Reader:   *reader,
	}

	if err := s.borrowedBookRepo.Create(borrowedBook); err != nil {
		return nil, err
	}

	// Уменьшаем количество доступных экземпляров
	book.CopiesCount--
	if err := s.bookRepo.Update(book); err != nil {
		// В идеале здесь должна быть транзакция, но для простоты оставим так
		return nil, err
	}

	return borrowedBook, nil
}

// ReturnBook возвращает книгу
func (s *borrowService) ReturnBook(dto *models.ReturnBookDTO) (*models.BorrowedBook, error) {
	// Находим активную выдачу
	borrowedBook, err := s.borrowedBookRepo.GetActiveByBookAndReader(dto.BookID, dto.ReaderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("активная выдача этой книги этому читателю не найдена")
		}
		return nil, err
	}

	// Бизнес-правило 3: Проверяем, что книга ещё не возвращена
	if borrowedBook.IsReturned() {
		return nil, errors.New("книга уже возвращена")
	}

	// Отмечаем книгу как возвращенную
	borrowedBook.MarkReturned()
	if err := s.borrowedBookRepo.Update(borrowedBook); err != nil {
		return nil, err
	}

	// Увеличиваем количество доступных экземпляров
	book, err := s.bookRepo.GetByID(dto.BookID)
	if err != nil {
		return nil, err
	}

	book.CopiesCount++
	if err := s.bookRepo.Update(book); err != nil {
		// В идеале здесь должна быть транзакция, но для простоты оставим так
		return nil, err
	}

	// Загружаем связанные данные
	updatedBorrow, err := s.borrowedBookRepo.GetByID(borrowedBook.ID)
	if err != nil {
		return nil, err
	}

	return updatedBorrow, nil
}

// GetBorrowedBooksByReader возвращает все активные выдачи для читателя
func (s *borrowService) GetBorrowedBooksByReader(readerID uuid.UUID) ([]models.BorrowedBook, error) {
	// Проверяем существование читателя
	_, err := s.readerRepo.GetByID(readerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("читатель не найден")
		}
		return nil, err
	}

	return s.borrowedBookRepo.GetActiveByReaderID(readerID)
}
