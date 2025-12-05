package handlers

import (
	"github.com/go-playground/validator/v10"
	"github.com/oneErrortime/afst/internal/services"
	"github.com/oneErrortime/afst/internal/storage"
)

type Handlers struct {
	Auth           *AuthHandler
	Book           *BookHandler
	Reader         *ReaderHandler
	Borrow         *BorrowHandler
	UserGroup      *UserGroupHandler
	Category       *CategoryHandler
	Subscription   *SubscriptionHandler
	BookAccess     *BookAccessHandler
	BookFile       *BookFileHandler
	ReadingSession *ReadingSessionHandler
	Services       *services.Services
}

func NewHandlers(services *services.Services, validator *validator.Validate) *Handlers {
	return &Handlers{
		Auth:     NewAuthHandler(services.Auth, validator),
		Book:     NewBookHandler(services.Book, validator),
		Reader:   NewReaderHandler(services.Reader, validator),
		Borrow:   NewBorrowHandler(services.Borrow, validator),
		Services: services,
	}
}

func NewExtendedHandlers(services *services.Services, fileStorage storage.FileStorage, validator *validator.Validate) *Handlers {
	return &Handlers{
		Auth:           NewAuthHandler(services.Auth, validator),
		Book:           NewBookHandler(services.Book, validator),
		Reader:         NewReaderHandler(services.Reader, validator),
		Borrow:         NewBorrowHandler(services.Borrow, validator),
		UserGroup:      NewUserGroupHandler(services.UserGroup, validator),
		Category:       NewCategoryHandler(services.Category, validator),
		Subscription:   NewSubscriptionHandler(services.Subscription, validator),
		BookAccess:     NewBookAccessHandler(services.BookAccess, validator),
		BookFile:       NewBookFileHandler(services.BookFile, services.BookAccess, fileStorage, validator),
		ReadingSession: NewReadingSessionHandler(services.ReadingSession, services.BookAccess, validator),
		Services:       services,
	}
}
