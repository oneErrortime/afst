package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type readingSessionRepository struct {
	db *gorm.DB
}

func NewReadingSessionRepository(db *gorm.DB) *readingSessionRepository {
	return &readingSessionRepository{db: db}
}

func (r *readingSessionRepository) Create(session *models.ReadingSession) error {
	return r.db.Create(session).Error
}

func (r *readingSessionRepository) GetByID(id uuid.UUID) (*models.ReadingSession, error) {
	var session models.ReadingSession
	err := r.db.Preload("User").Preload("Book").First(&session, "id = ?", id).Error
	return &session, err
}

func (r *readingSessionRepository) GetByUserID(userID uuid.UUID, limit int) ([]models.ReadingSession, error) {
	var sessions []models.ReadingSession
	err := r.db.Preload("Book").Where("user_id = ?", userID).Order("started_at DESC").Limit(limit).Find(&sessions).Error
	return sessions, err
}

func (r *readingSessionRepository) GetByBookID(bookID uuid.UUID) ([]models.ReadingSession, error) {
	var sessions []models.ReadingSession
	err := r.db.Where("book_id = ?", bookID).Find(&sessions).Error
	return sessions, err
}

func (r *readingSessionRepository) GetActiveByUserAndBook(userID, bookID uuid.UUID) (*models.ReadingSession, error) {
	var session models.ReadingSession
	err := r.db.Where("user_id = ? AND book_id = ? AND ended_at IS NULL", userID, bookID).First(&session).Error
	return &session, err
}

func (r *readingSessionRepository) Update(session *models.ReadingSession) error {
	return r.db.Save(session).Error
}

func (r *readingSessionRepository) GetBookStats(bookID uuid.UUID) (totalReaders, totalSessions, totalReadTime int64, err error) {
	err = r.db.Model(&models.ReadingSession{}).Where("book_id = ?", bookID).Count(&totalSessions).Error
	if err != nil {
		return
	}

	err = r.db.Model(&models.ReadingSession{}).Where("book_id = ?", bookID).Distinct("user_id").Count(&totalReaders).Error
	if err != nil {
		return
	}

	var result struct {
		Total int64
	}
	err = r.db.Model(&models.ReadingSession{}).Select("COALESCE(SUM(duration), 0) as total").Where("book_id = ?", bookID).Scan(&result).Error
	totalReadTime = result.Total
	return
}
