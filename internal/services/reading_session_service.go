package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type readingSessionService struct {
	sessionRepo repository.ReadingSessionRepository
	accessRepo  repository.BookAccessRepository
}

func NewReadingSessionService(
	sessionRepo repository.ReadingSessionRepository,
	accessRepo repository.BookAccessRepository,
) ReadingSessionService {
	return &readingSessionService{
		sessionRepo: sessionRepo,
		accessRepo:  accessRepo,
	}
}

func (s *readingSessionService) StartSession(userID, bookID, accessID uuid.UUID, deviceInfo string) (*models.ReadingSession, error) {
	access, err := s.accessRepo.GetByID(accessID)
	if err != nil {
		return nil, errors.New("доступ не найден")
	}

	if !access.IsValid() {
		return nil, errors.New("доступ к книге истек")
	}

	existing, _ := s.sessionRepo.GetActiveByUserAndBook(userID, bookID)
	if existing != nil {
		now := time.Now()
		existing.EndedAt = &now
		existing.Duration = int64(now.Sub(existing.StartedAt).Seconds())
		s.sessionRepo.Update(existing)
	}

	session := &models.ReadingSession{
		UserID:     userID,
		BookID:     bookID,
		AccessID:   accessID,
		StartedAt:  time.Now(),
		StartPage:  access.CurrentPage,
		DeviceType: deviceInfo,
	}

	if err := s.sessionRepo.Create(session); err != nil {
		return nil, err
	}

	return session, nil
}

func (s *readingSessionService) EndSession(sessionID uuid.UUID, endPage int) error {
	session, err := s.sessionRepo.GetByID(sessionID)
	if err != nil {
		return err
	}

	now := time.Now()
	session.EndedAt = &now
	session.EndPage = endPage
	session.Duration = int64(now.Sub(session.StartedAt).Seconds())

	return s.sessionRepo.Update(session)
}

func (s *readingSessionService) GetUserSessions(userID uuid.UUID, limit int) ([]models.ReadingSession, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.sessionRepo.GetByUserID(userID, limit)
}

func (s *readingSessionService) GetBookStats(bookID uuid.UUID) (*models.BookReadingStats, error) {
	totalReaders, totalSessions, totalReadTime, err := s.sessionRepo.GetBookStats(bookID)
	if err != nil {
		return nil, err
	}

	avgReadTime := int64(0)
	if totalSessions > 0 {
		avgReadTime = totalReadTime / totalSessions
	}

	return &models.BookReadingStats{
		BookID:        bookID,
		TotalReaders:  totalReaders,
		TotalSessions: totalSessions,
		TotalReadTime: totalReadTime,
		AvgReadTime:   avgReadTime,
	}, nil
}
