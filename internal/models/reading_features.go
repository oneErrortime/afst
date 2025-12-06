package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Collection представляет собой пользовательскую коллекцию книг (например, "Избранное", "Прочитать позже").
type Collection struct {
	ID          uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	UserID      uuid.UUID  `json:"user_id" gorm:"type:text;not null;index"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Books       []*Book    `json:"books,omitempty" gorm:"many2many:collection_books;"`
	User        *User      `json:"-" gorm:"foreignKey:UserID"`
}

// TableName возвращает имя таблицы для модели Collection.
func (Collection) TableName() string {
	return "collections"
}

// BeforeCreate добавляет UUID перед созданием записи.
func (c *Collection) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}

// Review представляет собой отзыв пользователя на книгу.
type Review struct {
	ID        uuid.UUID  `json:"id" gorm:"type:text;primary_key"`
	UserID    uuid.UUID  `json:"user_id" gorm:"type:text;not null;index"`
	BookID    uuid.UUID  `json:"book_id" gorm:"type:text;not null;index"`
	Rating    int        `json:"rating" gorm:"not null;check:rating >= 1 AND rating <= 5"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	User      *User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Book      *Book      `json:"-" gorm:"foreignKey:BookID"`
}

// TableName возвращает имя таблицы для модели Review.
func (Review) TableName() string {
	return "reviews"
}

// BeforeCreate добавляет UUID перед созданием записи.
func (r *Review) BeforeCreate(tx *gorm.DB) (err error) {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return
}

// Bookmark представляет собой закладку в книге.
type Bookmark struct {
	ID        uuid.UUID `json:"id" gorm:"type:text;primary_key"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:text;not null;index"`
	BookID    uuid.UUID `json:"book_id" gorm:"type:text;not null;index"`
	Location  string    `json:"location" gorm:"not null"` // Может быть номером страницы, CFI для EPUB, и т.д.
	Label     string    `json:"label"`
	CreatedAt time.Time `json:"created_at"`
	User      *User     `json:"-" gorm:"foreignKey:UserID"`
	Book      *Book     `json:"-" gorm:"foreignKey:BookID"`
}

// TableName возвращает имя таблицы для модели Bookmark.
func (Bookmark) TableName() string {
	return "bookmarks"
}

// BeforeCreate добавляет UUID перед созданием записи.
func (b *Bookmark) BeforeCreate(tx *gorm.DB) (err error) {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return
}

// Annotation представляет собой заметку или выделение текста в книге.
type Annotation struct {
	ID          uuid.UUID `json:"id" gorm:"type:text;primary_key"`
	UserID      uuid.UUID `json:"user_id" gorm:"type:text;not null;index"`
	BookID      uuid.UUID `json:"book_id" gorm:"type:text;not null;index"`
	Location    string    `json:"location" gorm:"not null"`    // Местоположение в книге
	HighlightedText string `json:"highlighted_text"`          // Выделенный текст
	Note        string    `json:"note"`                        // Текст заметки
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	User        *User     `json:"-" gorm:"foreignKey:UserID"`
	Book        *Book     `json:"-" gorm:"foreignKey:BookID"`
}

// TableName возвращает имя таблицы для модели Annotation.
func (Annotation) TableName() string {
	return "annotations"
}

// BeforeCreate добавляет UUID перед созданием записи.
func (a *Annotation) BeforeCreate(tx *gorm.DB) (err error) {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return
}
