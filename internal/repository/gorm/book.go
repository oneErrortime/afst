package gorm

import (
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// bookRepository реализация BookRepository для GORM
type bookRepository struct {
	db *gorm.DB
}

// NewBookRepository создает новый экземпляр bookRepository
func NewBookRepository(db *gorm.DB) repository.BookRepository {
	return &bookRepository{db: db}
}

// Create создает новую книгу
func (r *bookRepository) Create(book *models.Book) error {
	return r.db.Create(book).Error
}

// GetByID находит книгу по ID
func (r *bookRepository) GetByID(id uuid.UUID) (*models.Book, error) {
	var book models.Book
	err := r.db.Where("id = ?", id).First(&book).Error
	if err != nil {
		return nil, err
	}
	return &book, nil
}

// GetRecommendations возвращает список рекомендованных книг.
func (r *bookRepository) GetRecommendations(bookID uuid.UUID, limit int) ([]models.Book, error) {
	var recommendedBooks []models.Book

	// 1. Находим всех пользователей, которые взаимодействовали с данной книгой (через BookAccess).
	var userIDs []uuid.UUID
	r.db.Model(&models.BookAccess{}).Where("book_id = ?", bookID).Pluck("user_id", &userIDs)

	if len(userIDs) == 0 {
		// Если никто не читал, можно вернуть просто популярные книги
		return r.GetAll(limit, 0)
	}

	// 2. Находим все книги, с которыми взаимодействовали эти пользователи, исключая текущую.
	// 3. Группируем по ID книги, считаем количество, сортируем по популярности.
	err := r.db.Model(&models.Book{}).
		Joins("JOIN book_accesses ON book_accesses.book_id = books.id").
		Where("book_accesses.user_id IN (?)", userIDs).
		Where("books.id != ?", bookID).
		Group("books.id").
		Order("count(books.id) DESC").
		Limit(limit).
		Find(&recommendedBooks).Error

	return recommendedBooks, err
}

// Count возвращает общее количество книг
func (r *bookRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.Book{}).Count(&count).Error
	return count, err
}

// CountPublished возвращает количество опубликованных книг
func (r *bookRepository) CountPublished() (int64, error) {
	var count int64
	err := r.db.Model(&models.Book{}).Where("status = ?", "published").Count(&count).Error
	return count, err
}

// GetAll возвращает все книги с пагинацией
func (r *bookRepository) GetAll(limit, offset int) ([]models.Book, error) {
	var books []models.Book
	err := r.db.Limit(limit).Offset(offset).Find(&books).Error
	return books, err
}

// Update обновляет книгу
func (r *bookRepository) Update(book *models.Book) error {
	return r.db.Save(book).Error
}

// Delete удаляет книгу (soft delete)
func (r *bookRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Book{}, id).Error
}

// GetByISBN находит книгу по ISBN
func (r *bookRepository) GetByISBN(isbn string) (*models.Book, error) {
	var book models.Book
	err := r.db.Where("isbn = ?", isbn).First(&book).Error
	if err != nil {
		return nil, err
	}
	return &book, nil
}
