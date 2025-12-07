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
		FeatureFlag:  NewFeatureFlagRepository(db),
	}
}

func NewExtendedRepository(db *gorm.DB) *repository.ExtendedRepository {
	return &repository.ExtendedRepository{
		Repository: repository.Repository{
			User:         NewUserRepository(db),
			Book:         NewBookRepository(db),
			Reader:       NewReaderRepository(db),
			BorrowedBook: NewBorrowedBookRepository(db),
			FeatureFlag:  NewFeatureFlagRepository(db),
		},
		UserGroup:      NewUserGroupRepository(db),
		Category:       NewCategoryRepository(db),
		Subscription:   NewSubscriptionRepository(db),
		BookAccess:     NewBookAccessRepository(db),
		BookFile:       NewBookFileRepository(db),
		ReadingSession: NewReadingSessionRepository(db),
		Social:         NewSocialRepository(db),
		Collection:     NewCollectionRepository(db),
		Review:         NewReviewRepository(db),
		Bookmark:       NewBookmarkRepository(db),
		DB:             db,
	}
}

func WithTransaction(repo *repository.ExtendedRepository, fn repository.TransactionFunc) error {
	db, ok := repo.DB.(*gorm.DB)
	if !ok {
		return fn(repo)
	}

	return db.Transaction(func(tx *gorm.DB) error {
		txRepo := &repository.ExtendedRepository{
			Repository: repository.Repository{
				User:         NewUserRepository(tx),
				Book:         NewBookRepository(tx),
				Reader:       NewReaderRepository(tx),
				BorrowedBook: NewBorrowedBookRepository(tx),
			},
			UserGroup:      NewUserGroupRepository(tx),
			Category:       NewCategoryRepository(tx),
			Subscription:   NewSubscriptionRepository(tx),
			BookAccess:     NewBookAccessRepository(tx),
			BookFile:       NewBookFileRepository(tx),
			ReadingSession: NewReadingSessionRepository(tx),
			Social:         NewSocialRepository(tx),
			DB:             tx,
		}
		return fn(txRepo)
	})
}
