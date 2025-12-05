package services

import (
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/repository"
	"github.com/oneErrortime/afst/internal/storage"
)

func NewServices(repos *repository.Repository, jwtService *auth.JWTService) *Services {
	return &Services{
		Auth:        NewAuthService(repos.User, nil, jwtService),
		Book:        NewBookService(repos.Book),
		Reader:      NewReaderService(repos.Reader),
		Borrow:      NewBorrowService(repos.Book, repos.Reader, repos.BorrowedBook),
		FeatureFlag: NewFeatureFlagService(repos.FeatureFlag),
	}
}

func NewExtendedServices(repos *repository.ExtendedRepository, jwtService *auth.JWTService, fileStorage storage.FileStorage) *Services {
	return &Services{
		Auth:           NewAuthService(repos.User, repos.UserGroup, jwtService),
		Book:           NewBookService(repos.Book),
		Reader:         NewReaderService(repos.Reader),
		Borrow:         NewBorrowServiceWithTransaction(repos),
		UserGroup:      NewUserGroupService(repos.UserGroup, repos.User),
		Category:       NewCategoryService(repos.Category),
		Subscription:   NewSubscriptionService(repos.Subscription, repos.User),
		BookAccess:     NewBookAccessService(repos.BookAccess, repos.Book, repos.User, repos.Subscription, repos.UserGroup),
		BookFile:       NewBookFileService(repos.BookFile, repos.Book, fileStorage),
		ReadingSession: NewReadingSessionService(repos.ReadingSession, repos.BookAccess),
		FeatureFlag:    NewFeatureFlagService(repos.FeatureFlag),
	}
}
