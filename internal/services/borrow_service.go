package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
	gormrepo "github.com/oneErrortime/afst/internal/repository/gorm"
	"gorm.io/gorm"
)

type borrowService struct {
	bookRepo         repository.BookRepository
	readerRepo       repository.ReaderRepository
	borrowedBookRepo repository.BorrowedBookRepository
	extendedRepo     *repository.ExtendedRepository
}

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

func NewBorrowServiceWithTransaction(
	extendedRepo *repository.ExtendedRepository,
) BorrowService {
	return &borrowService{
		bookRepo:         extendedRepo.Book,
		readerRepo:       extendedRepo.Reader,
		borrowedBookRepo: extendedRepo.BorrowedBook,
		extendedRepo:     extendedRepo,
	}
}

func (s *borrowService) BorrowBook(dto *models.BorrowBookDTO) (*models.BorrowedBook, error) {
	if s.extendedRepo != nil {
		return s.borrowBookWithTransaction(dto)
	}
	return s.borrowBookDirect(dto)
}

func (s *borrowService) borrowBookWithTransaction(dto *models.BorrowBookDTO) (*models.BorrowedBook, error) {
	var result *models.BorrowedBook

	err := gormrepo.WithTransaction(s.extendedRepo, func(txRepo *repository.ExtendedRepository) error {
		book, err := txRepo.Book.GetByID(dto.BookID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("книга не найдена")
			}
			return err
		}

		reader, err := txRepo.Reader.GetByID(dto.ReaderID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("читатель не найден")
			}
			return err
		}

		if book.CopiesCount <= 0 {
			return errors.New("нет доступных экземпляров книги")
		}

		activeBorrowsCount, err := txRepo.BorrowedBook.CountActiveByReader(dto.ReaderID)
		if err != nil {
			return err
		}
		if activeBorrowsCount >= 3 {
			return errors.New("читатель уже взял максимальное количество книг (3)")
		}

		existingBorrow, err := txRepo.BorrowedBook.GetActiveByBookAndReader(dto.BookID, dto.ReaderID)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if existingBorrow != nil {
			return errors.New("читатель уже взял эту книгу")
		}

		borrowedBook := &models.BorrowedBook{
			BookID:   dto.BookID,
			ReaderID: dto.ReaderID,
			Book:     *book,
			Reader:   *reader,
		}

		if err := txRepo.BorrowedBook.Create(borrowedBook); err != nil {
			return err
		}

		book.CopiesCount--
		if err := txRepo.Book.Update(book); err != nil {
			return err
		}

		result = borrowedBook
		return nil
	})

	return result, err
}

func (s *borrowService) borrowBookDirect(dto *models.BorrowBookDTO) (*models.BorrowedBook, error) {
	book, err := s.bookRepo.GetByID(dto.BookID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("книга не найдена")
		}
		return nil, err
	}

	reader, err := s.readerRepo.GetByID(dto.ReaderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("читатель не найден")
		}
		return nil, err
	}

	if book.CopiesCount <= 0 {
		return nil, errors.New("нет доступных экземпляров книги")
	}

	activeBorrowsCount, err := s.borrowedBookRepo.CountActiveByReader(dto.ReaderID)
	if err != nil {
		return nil, err
	}
	if activeBorrowsCount >= 3 {
		return nil, errors.New("читатель уже взял максимальное количество книг (3)")
	}

	existingBorrow, err := s.borrowedBookRepo.GetActiveByBookAndReader(dto.BookID, dto.ReaderID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existingBorrow != nil {
		return nil, errors.New("читатель уже взял эту книгу")
	}

	borrowedBook := &models.BorrowedBook{
		BookID:   dto.BookID,
		ReaderID: dto.ReaderID,
		Book:     *book,
		Reader:   *reader,
	}

	if err := s.borrowedBookRepo.Create(borrowedBook); err != nil {
		return nil, err
	}

	book.CopiesCount--
	if err := s.bookRepo.Update(book); err != nil {
		return nil, err
	}

	return borrowedBook, nil
}

func (s *borrowService) ReturnBook(dto *models.ReturnBookDTO) (*models.BorrowedBook, error) {
	if s.extendedRepo != nil {
		return s.returnBookWithTransaction(dto)
	}
	return s.returnBookDirect(dto)
}

func (s *borrowService) returnBookWithTransaction(dto *models.ReturnBookDTO) (*models.BorrowedBook, error) {
	var result *models.BorrowedBook

	err := gormrepo.WithTransaction(s.extendedRepo, func(txRepo *repository.ExtendedRepository) error {
		borrowedBook, err := txRepo.BorrowedBook.GetActiveByBookAndReader(dto.BookID, dto.ReaderID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("активная выдача этой книги этому читателю не найдена")
			}
			return err
		}

		if borrowedBook.IsReturned() {
			return errors.New("книга уже возвращена")
		}

		borrowedBook.MarkReturned()
		if err := txRepo.BorrowedBook.Update(borrowedBook); err != nil {
			return err
		}

		book, err := txRepo.Book.GetByID(dto.BookID)
		if err != nil {
			return err
		}

		book.CopiesCount++
		if err := txRepo.Book.Update(book); err != nil {
			return err
		}

		updatedBorrow, err := txRepo.BorrowedBook.GetByID(borrowedBook.ID)
		if err != nil {
			return err
		}

		result = updatedBorrow
		return nil
	})

	return result, err
}

func (s *borrowService) returnBookDirect(dto *models.ReturnBookDTO) (*models.BorrowedBook, error) {
	borrowedBook, err := s.borrowedBookRepo.GetActiveByBookAndReader(dto.BookID, dto.ReaderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("активная выдача этой книги этому читателю не найдена")
		}
		return nil, err
	}

	if borrowedBook.IsReturned() {
		return nil, errors.New("книга уже возвращена")
	}

	borrowedBook.MarkReturned()
	if err := s.borrowedBookRepo.Update(borrowedBook); err != nil {
		return nil, err
	}

	book, err := s.bookRepo.GetByID(dto.BookID)
	if err != nil {
		return nil, err
	}

	book.CopiesCount++
	if err := s.bookRepo.Update(book); err != nil {
		return nil, err
	}

	updatedBorrow, err := s.borrowedBookRepo.GetByID(borrowedBook.ID)
	if err != nil {
		return nil, err
	}

	return updatedBorrow, nil
}

func (s *borrowService) GetBorrowedBooksByReader(readerID uuid.UUID) ([]models.BorrowedBook, error) {
	_, err := s.readerRepo.GetByID(readerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("читатель не найден")
		}
		return nil, err
	}

	return s.borrowedBookRepo.GetActiveByReaderID(readerID)
}
