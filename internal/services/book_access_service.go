package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type bookAccessService struct {
	accessRepo       repository.BookAccessRepository
	bookRepo         repository.BookRepository
	userRepo         repository.UserRepository
	subscriptionRepo repository.SubscriptionRepository
	groupRepo        repository.UserGroupRepository
}

func NewBookAccessService(
	accessRepo repository.BookAccessRepository,
	bookRepo repository.BookRepository,
	userRepo repository.UserRepository,
	subscriptionRepo repository.SubscriptionRepository,
	groupRepo repository.UserGroupRepository,
) BookAccessService {
	return &bookAccessService{
		accessRepo:       accessRepo,
		bookRepo:         bookRepo,
		userRepo:         userRepo,
		subscriptionRepo: subscriptionRepo,
		groupRepo:        groupRepo,
	}
}

func (s *bookAccessService) GrantAccess(dto *models.GrantAccessDTO) (*models.BookAccess, error) {
	user, err := s.userRepo.GetByID(dto.UserID)
	if err != nil {
		return nil, errors.New("пользователь не найден")
	}

	book, err := s.bookRepo.GetByID(dto.BookID)
	if err != nil {
		return nil, errors.New("книга не найдена")
	}

	if book.IsPremium {
		sub, _ := s.subscriptionRepo.GetActiveByUserID(dto.UserID)
		if sub == nil || !sub.CanAccessPremium {
			return nil, errors.New("для доступа к премиум книгам требуется подписка")
		}
	}

	existing, _ := s.accessRepo.GetActiveByUserAndBook(dto.UserID, dto.BookID)
	if existing != nil {
		return nil, errors.New("у пользователя уже есть доступ к этой книге")
	}

	maxBooks := 3
	loanDays := dto.Days
	if user.GroupID != nil {
		group, err := s.groupRepo.GetByID(*user.GroupID)
		if err == nil {
			maxBooks = group.MaxBooks
			if loanDays > group.LoanDays {
				loanDays = group.LoanDays
			}
		}
	}

	activeCount, _ := s.accessRepo.CountActiveByUser(dto.UserID)
	if activeCount >= int64(maxBooks) {
		return nil, errors.New("превышен лимит активных книг")
	}

	now := time.Now()
	access := &models.BookAccess{
		UserID:    dto.UserID,
		BookID:    dto.BookID,
		Type:      dto.Type,
		Status:    models.AccessStatusActive,
		StartDate: now,
		EndDate:   now.AddDate(0, 0, loanDays),
	}

	if err := s.accessRepo.Create(access); err != nil {
		return nil, err
	}

	return access, nil
}

func (s *bookAccessService) GetByID(id uuid.UUID) (*models.BookAccess, error) {
	return s.accessRepo.GetByID(id)
}

func (s *bookAccessService) GetByUserID(userID uuid.UUID) ([]models.BookAccess, error) {
	return s.accessRepo.GetByUserID(userID)
}

func (s *bookAccessService) GetActiveByUserAndBook(userID, bookID uuid.UUID) (*models.BookAccess, error) {
	return s.accessRepo.GetActiveByUserAndBook(userID, bookID)
}

func (s *bookAccessService) CheckAccess(userID, bookID uuid.UUID) (bool, error) {
	access, err := s.accessRepo.GetActiveByUserAndBook(userID, bookID)
	if err != nil {
		return false, nil
	}
	return access.IsValid(), nil
}

func (s *bookAccessService) RevokeAccess(id uuid.UUID) error {
	access, err := s.accessRepo.GetByID(id)
	if err != nil {
		return err
	}

	access.Status = models.AccessStatusRevoked
	return s.accessRepo.Update(access)
}

func (s *bookAccessService) UpdateProgress(id uuid.UUID, currentPage int, readTime time.Duration) error {
	access, err := s.accessRepo.GetByID(id)
	if err != nil {
		return err
	}

	access.CurrentPage = currentPage
	access.TotalReadTime += int64(readTime.Seconds())
	now := time.Now()
	access.LastAccessedAt = &now

	return s.accessRepo.Update(access)
}

func (s *bookAccessService) GetUserLibrary(userID uuid.UUID) ([]models.BookAccessWithBook, error) {
	accesses, err := s.accessRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	result := make([]models.BookAccessWithBook, len(accesses))
	for i, access := range accesses {
		book, _ := s.bookRepo.GetByID(access.BookID)
		result[i] = models.BookAccessWithBook{
			BookAccess: access,
		}
		if book != nil {
			result[i].Book = *book
		}
	}

	return result, nil
}
