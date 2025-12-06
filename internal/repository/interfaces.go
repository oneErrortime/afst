package repository

import (
	"github.com/oneErrortime/afst/internal/models"

	"github.com/google/uuid"
)

type UserRepository interface {
	Create(user *models.User) error
	GetByEmail(email string) (*models.User, error)
	GetByID(id uuid.UUID) (*models.User, error)
	Update(user *models.User) error
	Delete(id uuid.UUID) error
	List(limit, offset int) ([]models.User, error)
	Count() (int64, error)
	CountByRole(role models.UserRole) (int64, error)
	GetByGroupID(groupID uuid.UUID) ([]models.User, error)
}

// BookRepository определяет интерфейс для работы с книгами
type BookRepository interface {
	Create(book *models.Book) error
	GetByID(id uuid.UUID) (*models.Book, error)
	GetAll(limit, offset int) ([]models.Book, error)
	Update(book *models.Book) error
	Delete(id uuid.UUID) error
	GetByISBN(isbn string) (*models.Book, error)
	Count() (int64, error)
	CountPublished() (int64, error)
}

// ReaderRepository определяет интерфейс для работы с читателями
type ReaderRepository interface {
	Create(reader *models.Reader) error
	GetByID(id uuid.UUID) (*models.Reader, error)
	GetAll(limit, offset int) ([]models.Reader, error)
	Update(reader *models.Reader) error
	Delete(id uuid.UUID) error
	GetByEmail(email string) (*models.Reader, error)
	Count() (int64, error)
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
type FeatureFlagRepository interface {
	GetByName(name string) (*models.FeatureFlag, error)
	GetAll() ([]models.FeatureFlag, error)
}

type Repository struct {
	User         UserRepository
	Book         BookRepository
	Reader       ReaderRepository
	BorrowedBook BorrowedBookRepository
	FeatureFlag  FeatureFlagRepository
}

type ExtendedRepository struct {
	Repository
	UserGroup      UserGroupRepository
	Category       CategoryRepository
	Subscription   SubscriptionRepository
	BookAccess     BookAccessRepository
	BookFile       BookFileRepository
	ReadingSession ReadingSessionRepository
	Collection     CollectionRepository
	Bookmark       BookmarkRepository
	Annotation     AnnotationRepository
	Review         ReviewRepository
	DB             interface{}
}

type TransactionFunc func(*ExtendedRepository) error
package repository

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
)

type CollectionRepository interface {
	Create(collection *models.Collection) error
	GetByID(id uuid.UUID) (*models.Collection, error)
	GetByUserID(userID uuid.UUID) ([]models.Collection, error)
	GetPublic(limit, offset int) ([]models.Collection, error)
	Update(collection *models.Collection) error
	Delete(id uuid.UUID) error
	AddBook(collectionID, bookID uuid.UUID, sortOrder int, notes *string) error
	RemoveBook(collectionID, bookID uuid.UUID) error
	GetBooksInCollection(collectionID uuid.UUID) ([]models.Book, error)
	Count(userID uuid.UUID) (int64, error)
}

type BookmarkRepository interface {
	Create(bookmark *models.Bookmark) error
	GetByID(id uuid.UUID) (*models.Bookmark, error)
	GetByUserAndBook(userID, bookID uuid.UUID) ([]models.Bookmark, error)
	GetByUser(userID uuid.UUID, limit, offset int) ([]models.Bookmark, error)
	Update(bookmark *models.Bookmark) error
	Delete(id uuid.UUID) error
	Count(userID uuid.UUID) (int64, error)
}

type AnnotationRepository interface {
	Create(annotation *models.Annotation) error
	GetByID(id uuid.UUID) (*models.Annotation, error)
	GetByUserAndBook(userID, bookID uuid.UUID) ([]models.Annotation, error)
	GetByBookPublic(bookID uuid.UUID) ([]models.Annotation, error)
	Update(annotation *models.Annotation) error
	Delete(id uuid.UUID) error
	Count(userID uuid.UUID) (int64, error)
}

type ReviewRepository interface {
	Create(review *models.Review) error
	GetByID(id uuid.UUID) (*models.Review, error)
	GetByUserAndBook(userID, bookID uuid.UUID) (*models.Review, error)
	GetByBook(bookID uuid.UUID, limit, offset int) ([]models.Review, error)
	GetByUser(userID uuid.UUID, limit, offset int) ([]models.Review, error)
	Update(review *models.Review) error
	Delete(id uuid.UUID) error
	GetStatistics(bookID uuid.UUID) (*models.ReviewStatisticsDTO, error)
	Count(bookID uuid.UUID) (int64, error)
	GetAverageRating(bookID uuid.UUID) (float64, error)
}
