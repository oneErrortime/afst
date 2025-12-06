package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Review struct {
	ID         uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	UserID     uuid.UUID  `json:"user_id" gorm:"type:text;not null;index"`
	BookID     uuid.UUID  `json:"book_id" gorm:"type:text;not null;index"`
	Rating     int        `json:"rating" gorm:"not null" validate:"required,gte=1,lte=5"`
	Title      *string    `json:"title,omitempty" validate:"omitempty,max=200"`
	Content    *string    `json:"content,omitempty" validate:"omitempty,max=10000"`
	IsPublic   bool       `json:"is_public" gorm:"default:true"`
	LikesCount int        `json:"likes_count" gorm:"default:0"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	DeletedAt  *time.Time `json:"-" gorm:"index"`

	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Book *Book `json:"book,omitempty" gorm:"foreignKey:BookID"`
}

func (Review) TableName() string {
	return "reviews"
}

func (r *Review) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

type CreateReviewDTO struct {
	BookID   uuid.UUID `json:"book_id" validate:"required"`
	Rating   int       `json:"rating" validate:"required,gte=1,lte=5"`
	Title    *string   `json:"title,omitempty" validate:"omitempty,max=200"`
	Content  *string   `json:"content,omitempty" validate:"omitempty,max=10000"`
	IsPublic bool      `json:"is_public"`
}

type UpdateReviewDTO struct {
	Rating   *int    `json:"rating,omitempty" validate:"omitempty,gte=1,lte=5"`
	Title    *string `json:"title,omitempty" validate:"omitempty,max=200"`
	Content  *string `json:"content,omitempty" validate:"omitempty,max=10000"`
	IsPublic *bool   `json:"is_public,omitempty"`
}

type ReviewStatisticsDTO struct {
	BookID        uuid.UUID `json:"book_id"`
	TotalReviews  int       `json:"total_reviews"`
	AverageRating float64   `json:"average_rating"`
	Rating5Count  int       `json:"rating_5_count"`
	Rating4Count  int       `json:"rating_4_count"`
	Rating3Count  int       `json:"rating_3_count"`
	Rating2Count  int       `json:"rating_2_count"`
	Rating1Count  int       `json:"rating_1_count"`
}
