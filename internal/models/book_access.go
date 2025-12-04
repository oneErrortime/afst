package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccessType string

const (
	AccessTypeLoan       AccessType = "loan"
	AccessTypePurchase   AccessType = "purchase"
	AccessTypeSubscription AccessType = "subscription"
	AccessTypeTrial      AccessType = "trial"
)

type AccessStatus string

const (
	AccessStatusActive   AccessStatus = "active"
	AccessStatusExpired  AccessStatus = "expired"
	AccessStatusRevoked  AccessStatus = "revoked"
	AccessStatusReturned AccessStatus = "returned"
)

type BookAccess struct {
	ID             uuid.UUID    `json:"id" gorm:"type:text;primary_key"`
	UserID         uuid.UUID    `json:"user_id" gorm:"type:text;not null;index"`
	BookID         uuid.UUID    `json:"book_id" gorm:"type:text;not null;index"`
	Type           AccessType   `json:"type" gorm:"type:text;not null"`
	Status         AccessStatus `json:"status" gorm:"type:text;not null;default:'active'"`
	StartDate      time.Time    `json:"start_date" gorm:"not null"`
	EndDate        time.Time    `json:"end_date" gorm:"not null"`
	LastAccessedAt *time.Time   `json:"last_accessed_at,omitempty"`
	ReadProgress   float32      `json:"read_progress" gorm:"default:0"`
	CurrentPage    int          `json:"current_page" gorm:"default:0"`
	TotalReadTime  int          `json:"total_read_time" gorm:"default:0"`
	GrantedBy      *uuid.UUID   `json:"granted_by,omitempty" gorm:"type:text"`
	Notes          *string      `json:"notes,omitempty"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
	DeletedAt      *time.Time   `json:"-" gorm:"index"`

	User      *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Book      *Book `json:"book,omitempty" gorm:"foreignKey:BookID"`
	Granter   *User `json:"granter,omitempty" gorm:"foreignKey:GrantedBy"`
}

func (BookAccess) TableName() string {
	return "book_accesses"
}

func (a *BookAccess) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

func (a *BookAccess) IsValid() bool {
	now := time.Now()
	return a.Status == AccessStatusActive && now.After(a.StartDate) && now.Before(a.EndDate)
}

func (a *BookAccess) DaysRemaining() int {
	if !a.IsValid() {
		return 0
	}
	return int(time.Until(a.EndDate).Hours() / 24)
}

func (a *BookAccess) HoursRemaining() int {
	if !a.IsValid() {
		return 0
	}
	return int(time.Until(a.EndDate).Hours())
}

func (a *BookAccess) Expire() {
	a.Status = AccessStatusExpired
}

func (a *BookAccess) Revoke() {
	a.Status = AccessStatusRevoked
}

func (a *BookAccess) Return() {
	a.Status = AccessStatusReturned
}

func (a *BookAccess) UpdateProgress(page int, totalPages int) {
	a.CurrentPage = page
	if totalPages > 0 {
		a.ReadProgress = float32(page) / float32(totalPages) * 100
	}
	now := time.Now()
	a.LastAccessedAt = &now
}
