package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FileType string

const (
	FileTypePDF  FileType = "pdf"
	FileTypeEPUB FileType = "epub"
	FileTypeMOBI FileType = "mobi"
)

type BookFile struct {
	ID           uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	BookID       uuid.UUID  `json:"book_id" gorm:"type:text;not null;index"`
	FileName     string     `json:"file_name" gorm:"not null"`
	OriginalName string     `json:"original_name" gorm:"not null"`
	FilePath     string     `json:"-" gorm:"not null"`
	FileType     FileType   `json:"file_type" gorm:"type:text;not null"`
	FileSize     int64      `json:"file_size" gorm:"not null"`
	MimeType     string     `json:"mime_type" gorm:"not null"`
	Hash         string     `json:"-" gorm:"not null"`
	IsProcessed  bool       `json:"is_processed" gorm:"default:false"`
	PageCount    *int       `json:"page_count,omitempty"`
	Metadata     *string    `json:"metadata,omitempty" gorm:"type:text"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"-" gorm:"index"`

	Book *Book `json:"book,omitempty" gorm:"foreignKey:BookID"`
}

func (BookFile) TableName() string {
	return "book_files"
}

func (f *BookFile) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

func (f *BookFile) GetPublicURL() string {
	return "/api/v1/files/" + f.ID.String() + "/view"
}

func (f *BookFile) GetDownloadURL() string {
	return "/api/v1/files/" + f.ID.String() + "/download"
}
