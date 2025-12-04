package services

import (
	"mime/multipart"
	"time"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
)

type AuthService interface {
	Register(email, password string) (*models.AuthResponseDTO, error)
	Login(email, password string) (*models.AuthResponseDTO, error)
	GetUserByID(id string) (*models.UserResponseDTO, error)
	UpdateUser(id string, dto *models.UpdateUserDTO) (*models.User, error)
	ListUsers(limit, offset int) ([]models.User, int64, error)
	CreateAdmin(email, password, name string) (*models.User, error)
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

type UserGroupService interface {
	Create(dto *models.CreateUserGroupDTO) (*models.UserGroup, error)
	GetByID(id uuid.UUID) (*models.UserGroup, error)
	GetAll() ([]models.UserGroup, error)
	Update(id uuid.UUID, dto *models.UpdateUserGroupDTO) (*models.UserGroup, error)
	Delete(id uuid.UUID) error
	GetUsersByGroup(groupID uuid.UUID) ([]models.User, error)
	AssignUserToGroup(userID, groupID uuid.UUID) error
}

type CategoryService interface {
	Create(dto *models.CreateCategoryDTO) (*models.Category, error)
	GetByID(id uuid.UUID) (*models.Category, error)
	GetAll() ([]models.Category, error)
	GetBySlug(slug string) (*models.Category, error)
	Update(id uuid.UUID, dto *models.UpdateCategoryDTO) (*models.Category, error)
	Delete(id uuid.UUID) error
	GetChildren(parentID uuid.UUID) ([]models.Category, error)
}

type SubscriptionService interface {
	Create(userID uuid.UUID, plan models.SubscriptionPlan) (*models.Subscription, error)
	GetByID(id uuid.UUID) (*models.Subscription, error)
	GetByUserID(userID uuid.UUID) (*models.Subscription, error)
	GetActiveByUserID(userID uuid.UUID) (*models.Subscription, error)
	Cancel(id uuid.UUID) error
	Renew(id uuid.UUID) error
	GetPlans() []models.SubscriptionPlanConfig
}

type BookAccessService interface {
	GrantAccess(dto *models.GrantAccessDTO) (*models.BookAccess, error)
	GetByID(id uuid.UUID) (*models.BookAccess, error)
	GetByUserID(userID uuid.UUID) ([]models.BookAccess, error)
	GetActiveByUserAndBook(userID, bookID uuid.UUID) (*models.BookAccess, error)
	CheckAccess(userID, bookID uuid.UUID) (bool, error)
	RevokeAccess(id uuid.UUID) error
	UpdateProgress(id uuid.UUID, currentPage int, readTime time.Duration) error
	GetUserLibrary(userID uuid.UUID) ([]models.BookAccessWithBook, error)
}

type BookFileService interface {
	Upload(bookID uuid.UUID, file multipart.File, header *multipart.FileHeader) (*models.BookFile, error)
	GetByID(id uuid.UUID) (*models.BookFile, error)
	GetByBookID(bookID uuid.UUID) ([]models.BookFile, error)
	Delete(id uuid.UUID) error
	ServeFile(id uuid.UUID) (string, string, error)
}

type ReadingSessionService interface {
	StartSession(userID, bookID, accessID uuid.UUID, deviceInfo string) (*models.ReadingSession, error)
	EndSession(sessionID uuid.UUID, endPage int) error
	GetUserSessions(userID uuid.UUID, limit int) ([]models.ReadingSession, error)
	GetBookStats(bookID uuid.UUID) (*models.BookReadingStats, error)
}

type Services struct {
	Auth           AuthService
	Book           BookService
	Reader         ReaderService
	Borrow         BorrowService
	UserGroup      UserGroupService
	Category       CategoryService
	Subscription   SubscriptionService
	BookAccess     BookAccessService
	BookFile       BookFileService
	ReadingSession ReadingSessionService
}
