package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReadingSession struct {
	ID          uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	UserID      uuid.UUID  `json:"user_id" gorm:"type:text;not null;index"`
	BookID      uuid.UUID  `json:"book_id" gorm:"type:text;not null;index"`
	AccessID    uuid.UUID  `json:"access_id" gorm:"type:text;not null;index"`
	StartedAt   time.Time  `json:"started_at" gorm:"not null"`
	EndedAt     *time.Time `json:"ended_at,omitempty"`
	StartPage   int        `json:"start_page" gorm:"default:0"`
	EndPage     int        `json:"end_page" gorm:"default:0"`
	Duration    int        `json:"duration" gorm:"default:0"`
	UserAgent   *string    `json:"user_agent,omitempty"`
	IPAddress   *string    `json:"-"`
	DeviceType  *string    `json:"device_type,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	User   *User       `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Book   *Book       `json:"book,omitempty" gorm:"foreignKey:BookID"`
	Access *BookAccess `json:"access,omitempty" gorm:"foreignKey:AccessID"`
}

func (ReadingSession) TableName() string {
	return "reading_sessions"
}

func (s *ReadingSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

func (s *ReadingSession) End(endPage int) {
	now := time.Now()
	s.EndedAt = &now
	s.EndPage = endPage
	s.Duration = int(now.Sub(s.StartedAt).Seconds())
}

func (s *ReadingSession) IsActive() bool {
	return s.EndedAt == nil
}

func (s *ReadingSession) PagesRead() int {
	if s.EndPage > s.StartPage {
		return s.EndPage - s.StartPage
	}
	return 0
}
