package repository

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
)

type UserGroupRepository interface {
	Create(group *models.UserGroup) error
	GetByID(id uuid.UUID) (*models.UserGroup, error)
	GetAll() ([]models.UserGroup, error)
	GetByType(groupType models.UserGroupType) ([]models.UserGroup, error)
	Update(group *models.UserGroup) error
	Delete(id uuid.UUID) error
	GetUsersByGroupID(groupID uuid.UUID) ([]models.User, error)
}

type CategoryRepository interface {
	Create(category *models.Category) error
	GetByID(id uuid.UUID) (*models.Category, error)
	GetBySlug(slug string) (*models.Category, error)
	GetAll() ([]models.Category, error)
	GetByParentID(parentID *uuid.UUID) ([]models.Category, error)
	Update(category *models.Category) error
	Delete(id uuid.UUID) error
}

type SubscriptionRepository interface {
	Create(subscription *models.Subscription) error
	GetByID(id uuid.UUID) (*models.Subscription, error)
	GetByUserID(userID uuid.UUID) (*models.Subscription, error)
	GetActiveByUserID(userID uuid.UUID) (*models.Subscription, error)
	GetAll(limit, offset int) ([]models.Subscription, error)
	Update(subscription *models.Subscription) error
	Delete(id uuid.UUID) error
}

type BookAccessRepository interface {
	Create(access *models.BookAccess) error
	GetByID(id uuid.UUID) (*models.BookAccess, error)
	GetByUserID(userID uuid.UUID) ([]models.BookAccess, error)
	GetActiveByUserID(userID uuid.UUID) ([]models.BookAccess, error)
	GetByUserAndBook(userID, bookID uuid.UUID) (*models.BookAccess, error)
	GetActiveByUserAndBook(userID, bookID uuid.UUID) (*models.BookAccess, error)
	Update(access *models.BookAccess) error
	Delete(id uuid.UUID) error
	CountActiveByUser(userID uuid.UUID) (int64, error)
}

type BookFileRepository interface {
	Create(file *models.BookFile) error
	GetByID(id uuid.UUID) (*models.BookFile, error)
	GetByBookID(bookID uuid.UUID) ([]models.BookFile, error)
	GetByHash(hash string) (*models.BookFile, error)
	Update(file *models.BookFile) error
	Delete(id uuid.UUID) error
}

type ReadingSessionRepository interface {
	Create(session *models.ReadingSession) error
	GetByID(id uuid.UUID) (*models.ReadingSession, error)
	GetByUserID(userID uuid.UUID, limit int) ([]models.ReadingSession, error)
	GetByBookID(bookID uuid.UUID) ([]models.ReadingSession, error)
	GetActiveByUserAndBook(userID, bookID uuid.UUID) (*models.ReadingSession, error)
	Update(session *models.ReadingSession) error
	GetBookStats(bookID uuid.UUID) (totalReaders, totalSessions, totalReadTime int64, err error)
}

type ExtendedRepository struct {
	Repository
	UserGroup      UserGroupRepository
	Category       CategoryRepository
	Subscription   SubscriptionRepository
	BookAccess     BookAccessRepository
	BookFile       BookFileRepository
	ReadingSession ReadingSessionRepository
	DB             interface{}
}

type TransactionFunc func(txRepo *ExtendedRepository) error
