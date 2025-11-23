package tests

import (
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// MockBookRepository для тестирования
type MockBookRepository struct {
	mock.Mock
}

func (m *MockBookRepository) Create(book *models.Book) error {
	args := m.Called(book)
	return args.Error(0)
}

func (m *MockBookRepository) GetByID(id uuid.UUID) (*models.Book, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Book), args.Error(1)
}

func (m *MockBookRepository) GetAll(limit, offset int) ([]models.Book, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]models.Book), args.Error(1)
}

func (m *MockBookRepository) Update(book *models.Book) error {
	args := m.Called(book)
	return args.Error(0)
}

func (m *MockBookRepository) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockBookRepository) GetByISBN(isbn string) (*models.Book, error) {
	args := m.Called(isbn)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Book), args.Error(1)
}

// MockReaderRepository для тестирования
type MockReaderRepository struct {
	mock.Mock
}

func (m *MockReaderRepository) Create(reader *models.Reader) error {
	args := m.Called(reader)
	return args.Error(0)
}

func (m *MockReaderRepository) GetByID(id uuid.UUID) (*models.Reader, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Reader), args.Error(1)
}

func (m *MockReaderRepository) GetAll(limit, offset int) ([]models.Reader, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]models.Reader), args.Error(1)
}

func (m *MockReaderRepository) Update(reader *models.Reader) error {
	args := m.Called(reader)
	return args.Error(0)
}

func (m *MockReaderRepository) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockReaderRepository) GetByEmail(email string) (*models.Reader, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Reader), args.Error(1)
}

// MockBorrowedBookRepository для тестирования
type MockBorrowedBookRepository struct {
	mock.Mock
}

func (m *MockBorrowedBookRepository) Create(borrowedBook *models.BorrowedBook) error {
	args := m.Called(borrowedBook)
	return args.Error(0)
}

func (m *MockBorrowedBookRepository) GetByID(id uuid.UUID) (*models.BorrowedBook, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.BorrowedBook), args.Error(1)
}

func (m *MockBorrowedBookRepository) GetActiveByReaderID(readerID uuid.UUID) ([]models.BorrowedBook, error) {
	args := m.Called(readerID)
	return args.Get(0).([]models.BorrowedBook), args.Error(1)
}

func (m *MockBorrowedBookRepository) GetActiveByBookAndReader(bookID, readerID uuid.UUID) (*models.BorrowedBook, error) {
	args := m.Called(bookID, readerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.BorrowedBook), args.Error(1)
}

func (m *MockBorrowedBookRepository) Update(borrowedBook *models.BorrowedBook) error {
	args := m.Called(borrowedBook)
	return args.Error(0)
}

func (m *MockBorrowedBookRepository) CountActiveByReader(readerID uuid.UUID) (int64, error) {
	args := m.Called(readerID)
	return args.Get(0).(int64), args.Error(1)
}

func TestBorrowService_BorrowBook_Success(t *testing.T) {
	// Arrange
	mockBookRepo := new(MockBookRepository)
	mockReaderRepo := new(MockReaderRepository)
	mockBorrowedRepo := new(MockBorrowedBookRepository)

	borrowService := services.NewBorrowService(mockBookRepo, mockReaderRepo, mockBorrowedRepo)

	bookID := uuid.New()
	readerID := uuid.New()

	book := &models.Book{
		ID:          bookID,
		Title:       "Тестовая книга",
		Author:      "Тестовый автор",
		CopiesCount: 2,
	}

	reader := &models.Reader{
		ID:    readerID,
		Name:  "Тестовый читатель",
		Email: "reader@example.com",
	}

	dto := &models.BorrowBookDTO{
		BookID:   bookID,
		ReaderID: readerID,
	}

	// Mocks
	mockBookRepo.On("GetByID", bookID).Return(book, nil)
	mockReaderRepo.On("GetByID", readerID).Return(reader, nil)
	mockBorrowedRepo.On("CountActiveByReader", readerID).Return(int64(1), nil) // У читателя уже 1 книга
	mockBorrowedRepo.On("GetActiveByBookAndReader", bookID, readerID).Return((*models.BorrowedBook)(nil), gorm.ErrRecordNotFound)
	mockBorrowedRepo.On("Create", mock.AnythingOfType("*models.BorrowedBook")).Return(nil)
	mockBookRepo.On("Update", mock.AnythingOfType("*models.Book")).Return(nil)

	// Act
	result, err := borrowService.BorrowBook(dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, bookID, result.BookID)
	assert.Equal(t, readerID, result.ReaderID)

	// Проверяем, что уменьшилось количество копий
	mockBookRepo.AssertCalled(t, "Update", mock.MatchedBy(func(b *models.Book) bool {
		return b.CopiesCount == 1 // было 2, стало 1
	}))

	mockBookRepo.AssertExpectations(t)
	mockReaderRepo.AssertExpectations(t)
	mockBorrowedRepo.AssertExpectations(t)
}

func TestBorrowService_BorrowBook_NoAvailableCopies(t *testing.T) {
	// Arrange
	mockBookRepo := new(MockBookRepository)
	mockReaderRepo := new(MockReaderRepository)
	mockBorrowedRepo := new(MockBorrowedBookRepository)

	borrowService := services.NewBorrowService(mockBookRepo, mockReaderRepo, mockBorrowedRepo)

	bookID := uuid.New()
	readerID := uuid.New()

	book := &models.Book{
		ID:          bookID,
		Title:       "Тестовая книга",
		Author:      "Тестовый автор",
		CopiesCount: 0, // Нет доступных экземпляров
	}

	reader := &models.Reader{
		ID:    readerID,
		Name:  "Тестовый читатель",
		Email: "reader@example.com",
	}

	dto := &models.BorrowBookDTO{
		BookID:   bookID,
		ReaderID: readerID,
	}

	// Mocks
	mockBookRepo.On("GetByID", bookID).Return(book, nil)
	mockReaderRepo.On("GetByID", readerID).Return(reader, nil)

	// Act
	result, err := borrowService.BorrowBook(dto)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "нет доступных экземпляров книги")

	mockBookRepo.AssertExpectations(t)
	mockReaderRepo.AssertExpectations(t)
}

func TestBorrowService_BorrowBook_TooManyBooks(t *testing.T) {
	// Arrange
	mockBookRepo := new(MockBookRepository)
	mockReaderRepo := new(MockReaderRepository)
	mockBorrowedRepo := new(MockBorrowedBookRepository)

	borrowService := services.NewBorrowService(mockBookRepo, mockReaderRepo, mockBorrowedRepo)

	bookID := uuid.New()
	readerID := uuid.New()

	book := &models.Book{
		ID:          bookID,
		Title:       "Тестовая книга",
		Author:      "Тестовый автор",
		CopiesCount: 1,
	}

	reader := &models.Reader{
		ID:    readerID,
		Name:  "Тестовый читатель",
		Email: "reader@example.com",
	}

	dto := &models.BorrowBookDTO{
		BookID:   bookID,
		ReaderID: readerID,
	}

	// Mocks
	mockBookRepo.On("GetByID", bookID).Return(book, nil)
	mockReaderRepo.On("GetByID", readerID).Return(reader, nil)
	mockBorrowedRepo.On("CountActiveByReader", readerID).Return(int64(3), nil) // У читателя уже 3 книги

	// Act
	result, err := borrowService.BorrowBook(dto)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "читатель уже взял максимальное количество книг (3)")

	mockBookRepo.AssertExpectations(t)
	mockReaderRepo.AssertExpectations(t)
	mockBorrowedRepo.AssertExpectations(t)
}

func TestBorrowService_ReturnBook_Success(t *testing.T) {
	// Arrange
	mockBookRepo := new(MockBookRepository)
	mockReaderRepo := new(MockReaderRepository)
	mockBorrowedRepo := new(MockBorrowedBookRepository)

	borrowService := services.NewBorrowService(mockBookRepo, mockReaderRepo, mockBorrowedRepo)

	bookID := uuid.New()
	readerID := uuid.New()
	borrowedBookID := uuid.New()

	borrowedBook := &models.BorrowedBook{
		ID:         borrowedBookID,
		BookID:     bookID,
		ReaderID:   readerID,
		BorrowDate: time.Now().Add(-7 * 24 * time.Hour), // Взята неделю назад
		ReturnDate: nil,                                 // Ещё не возвращена
	}

	book := &models.Book{
		ID:          bookID,
		Title:       "Тестовая книга",
		Author:      "Тестовый автор",
		CopiesCount: 1,
	}

	updatedBorrowedBook := &models.BorrowedBook{
		ID:         borrowedBookID,
		BookID:     bookID,
		ReaderID:   readerID,
		BorrowDate: borrowedBook.BorrowDate,
		ReturnDate: &time.Time{}, // Теперь возвращена
	}

	dto := &models.ReturnBookDTO{
		BookID:   bookID,
		ReaderID: readerID,
	}

	// Mocks
	mockBorrowedRepo.On("GetActiveByBookAndReader", bookID, readerID).Return(borrowedBook, nil)
	mockBorrowedRepo.On("Update", mock.AnythingOfType("*models.BorrowedBook")).Return(nil)
	mockBookRepo.On("GetByID", bookID).Return(book, nil)
	mockBookRepo.On("Update", mock.AnythingOfType("*models.Book")).Return(nil)
	mockBorrowedRepo.On("GetByID", borrowedBookID).Return(updatedBorrowedBook, nil)

	// Act
	result, err := borrowService.ReturnBook(dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, bookID, result.BookID)
	assert.Equal(t, readerID, result.ReaderID)

	// Проверяем, что увеличилось количество копий
	mockBookRepo.AssertCalled(t, "Update", mock.MatchedBy(func(b *models.Book) bool {
		return b.CopiesCount == 2 // было 1, стало 2
	}))

	mockBookRepo.AssertExpectations(t)
	mockBorrowedRepo.AssertExpectations(t)
}

func TestBorrowService_ReturnBook_NotBorrowed(t *testing.T) {
	// Arrange
	mockBookRepo := new(MockBookRepository)
	mockReaderRepo := new(MockReaderRepository)
	mockBorrowedRepo := new(MockBorrowedBookRepository)

	borrowService := services.NewBorrowService(mockBookRepo, mockReaderRepo, mockBorrowedRepo)

	bookID := uuid.New()
	readerID := uuid.New()

	dto := &models.ReturnBookDTO{
		BookID:   bookID,
		ReaderID: readerID,
	}

	// Mocks - активная выдача не найдена
	mockBorrowedRepo.On("GetActiveByBookAndReader", bookID, readerID).Return((*models.BorrowedBook)(nil), gorm.ErrRecordNotFound)

	// Act
	result, err := borrowService.ReturnBook(dto)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "активная выдача этой книги этому читателю не найдена")

	mockBorrowedRepo.AssertExpectations(t)
}
