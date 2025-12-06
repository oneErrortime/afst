package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AnnotationType string

const (
	AnnotationTypeHighlight AnnotationType = "highlight"
	AnnotationTypeNote      AnnotationType = "note"
	AnnotationTypeUnderline AnnotationType = "underline"
	AnnotationTypeStrikeout AnnotationType = "strikeout"
)

type Annotation struct {
	ID          uuid.UUID      `json:"id" gorm:"type:text;primary_key"`
	UserID      uuid.UUID      `json:"user_id" gorm:"type:text;not null;index"`
	BookID      uuid.UUID      `json:"book_id" gorm:"type:text;not null;index"`
	FileID      *uuid.UUID     `json:"file_id,omitempty" gorm:"type:text;index"`
	Type        AnnotationType `json:"type" gorm:"type:text;not null" validate:"required"`
	PageNumber  int            `json:"page_number" gorm:"not null" validate:"required,gte=1"`
	Content     *string        `json:"content,omitempty"`
	SelectedText *string       `json:"selected_text,omitempty"`
	PositionData *string       `json:"position_data,omitempty"`
	Color        *string       `json:"color,omitempty"`
	IsPublic     bool          `json:"is_public" gorm:"default:false"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
	DeletedAt    *time.Time    `json:"-" gorm:"index"`

	User *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Book *Book     `json:"book,omitempty" gorm:"foreignKey:BookID"`
	File *BookFile `json:"file,omitempty" gorm:"foreignKey:FileID"`
}

func (Annotation) TableName() string {
	return "annotations"
}

func (a *Annotation) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

type CreateAnnotationDTO struct {
	BookID       uuid.UUID      `json:"book_id" validate:"required"`
	FileID       *uuid.UUID     `json:"file_id,omitempty"`
	Type         AnnotationType `json:"type" validate:"required,oneof=highlight note underline strikeout"`
	PageNumber   int            `json:"page_number" validate:"required,gte=1"`
	Content      *string        `json:"content,omitempty" validate:"omitempty,max=5000"`
	SelectedText *string        `json:"selected_text,omitempty" validate:"omitempty,max=1000"`
	PositionData *string        `json:"position_data,omitempty"`
	Color        *string        `json:"color,omitempty" validate:"omitempty,hexcolor"`
	IsPublic     bool           `json:"is_public"`
}

type UpdateAnnotationDTO struct {
	Content      *string `json:"content,omitempty" validate:"omitempty,max=5000"`
	Color        *string `json:"color,omitempty" validate:"omitempty,hexcolor"`
	IsPublic     *bool   `json:"is_public,omitempty"`
}
