package gorm

import (
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// borrowedBookRepository реализация BorrowedBookRepository для GORM
type borrowedBookRepository struct {
	db *gorm.DB
}

// NewBorrowedBookRepository создает новый экземпляр borrowedBookRepository
func NewBorrowedBookRepository(db *gorm.DB) repository.BorrowedBookRepository {
	return &borrowedBookRepository{db: db}
}

// Create создает новую запись о выдаче книги
func (r *borrowedBookRepository) Create(borrowedBook *models.BorrowedBook) error {
	return r.db.Create(borrowedBook).Error
}

// GetByID находит запись по ID
func (r *borrowedBookRepository) GetByID(id uuid.UUID) (*models.BorrowedBook, error) {
	var borrowedBook models.BorrowedBook
	err := r.db.Preload("Book").Preload("Reader").Where("id = ?", id).First(&borrowedBook).Error
	if err != nil {
		return nil, err
	}
	return &borrowedBook, nil
}

// GetActiveByReaderID возвращает все активные выдачи для читателя
func (r *borrowedBookRepository) GetActiveByReaderID(readerID uuid.UUID) ([]models.BorrowedBook, error) {
	var borrowedBooks []models.BorrowedBook
	err := r.db.Preload("Book").Preload("Reader").
		Where("reader_id = ? AND return_date IS NULL", readerID).
		Find(&borrowedBooks).Error
	return borrowedBooks, err
}

// GetActiveByBookAndReader находит активную выдачу конкретной книги конкретному читателю
func (r *borrowedBookRepository) GetActiveByBookAndReader(bookID, readerID uuid.UUID) (*models.BorrowedBook, error) {
	var borrowedBook models.BorrowedBook
	err := r.db.Where("book_id = ? AND reader_id = ? AND return_date IS NULL", bookID, readerID).First(&borrowedBook).Error
	if err != nil {
		return nil, err
	}
	return &borrowedBook, nil
}

// Update обновляет запись о выдаче
func (r *borrowedBookRepository) Update(borrowedBook *models.BorrowedBook) error {
	return r.db.Save(borrowedBook).Error
}

// CountActiveByReader считает количество активных выдач для читателя
func (r *borrowedBookRepository) CountActiveByReader(readerID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.BorrowedBook{}).
		Where("reader_id = ? AND return_date IS NULL", readerID).
		Count(&count).Error
	return count, err
}
