package gorm

import (
	"github.com/oneErrortime/afst/internal/repository"
	"gorm.io/gorm"
)

func NewRepository(db *gorm.DB) *repository.Repository {
	return &repository.Repository{
		User:         NewUserRepository(db),
		Book:         NewBookRepository(db),
		Reader:       NewReaderRepository(db),
		BorrowedBook: NewBorrowedBookRepository(db),
	}
}

func NewExtendedRepository(db *gorm.DB) *repository.ExtendedRepository {
	return &repository.ExtendedRepository{
		Repository: repository.Repository{
			User:         NewUserRepository(db),
			Book:         NewBookRepository(db),
			Reader:       NewReaderRepository(db),
			BorrowedBook: NewBorrowedBookRepository(db),
		},
		UserGroup:      NewUserGroupRepository(db),
		Category:       NewCategoryRepository(db),
		Subscription:   NewSubscriptionRepository(db),
		BookAccess:     NewBookAccessRepository(db),
		BookFile:       NewBookFileRepository(db),
		ReadingSession: NewReadingSessionRepository(db),
	}
}
