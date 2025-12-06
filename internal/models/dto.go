package models

import (
	"time"

	"github.com/google/uuid"
)

type AuthRequestDTO struct {
	Email    string `json:"email" validate:"required,email" example:"user@example.com"`
	Password string `json:"password" validate:"required,min=6" example:"password123"`
	Name     string `json:"name,omitempty" example:"John Doe"`
}

type AuthResponseDTO struct {
	Token   string           `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	User    *UserResponseDTO `json:"user,omitempty"`
	Message string           `json:"message" example:"Successfully authenticated"`
}

type CreateBookDTO struct {
	Title           string      `json:"title" validate:"required" example:"The Go Programming Language"`
	Author          string      `json:"author" validate:"required" example:"Alan A. A. Donovan"`
	PublicationYear *int        `json:"publication_year,omitempty" validate:"omitempty,gte=0,lte=9999" example:"2015"`
	ISBN            *string     `json:"isbn,omitempty" example:"978-0134190440"`
	CopiesCount     int         `json:"copies_count" validate:"gte=0" example:"10"`
	Description     *string     `json:"description,omitempty" example:"A masterpiece of programming language books."`
	CoverURL        *string     `json:"cover_url,omitempty" example:"https://images.gr-assets.com/books/1435093416l/25132924.jpg"`
	Language        *string     `json:"language,omitempty" example:"English"`
	PageCount       *int        `json:"page_count,omitempty" example:"380"`
	Publisher       *string     `json:"publisher,omitempty" example:"Addison-Wesley Professional"`
	IsPremium       bool        `json:"is_premium" example:"false"`
	CategoryIDs     []uuid.UUID `json:"category_ids,omitempty"`
}

type UpdateBookDTO struct {
	Title           *string     `json:"title,omitempty" example:"The Go Programming Language"`
	Author          *string     `json:"author,omitempty" example:"Alan A. A. Donovan"`
	PublicationYear *int        `json:"publication_year,omitempty" validate:"omitempty,gte=0,lte=9999" example:"2015"`
	ISBN            *string     `json:"isbn,omitempty" example:"978-0134190440"`
	CopiesCount     *int        `json:"copies_count,omitempty" validate:"omitempty,gte=0" example:"10"`
	Description     *string     `json:"description,omitempty" example:"A masterpiece of programming language books."`
	CoverURL        *string     `json:"cover_url,omitempty" example:"https://images.gr-assets.com/books/1435093416l/25132924.jpg"`
	Language        *string     `json:"language,omitempty" example:"English"`
	PageCount       *int        `json:"page_count,omitempty" example:"380"`
	Publisher       *string     `json:"publisher,omitempty" example:"Addison-Wesley Professional"`
	Status          *BookStatus `json:"status,omitempty" example:"published"`
	IsPremium       *bool       `json:"is_premium,omitempty" example:"false"`
	CategoryIDs     []uuid.UUID `json:"category_ids,omitempty"`
}

type CreateReaderDTO struct {
	Name  string `json:"name" validate:"required"`
	Email string `json:"email" validate:"required,email"`
}

type UpdateReaderDTO struct {
	Name  *string `json:"name,omitempty"`
	Email *string `json:"email,omitempty" validate:"omitempty,email"`
}

type BorrowBookDTO struct {
	BookID   uuid.UUID `json:"book_id" validate:"required"`
	ReaderID uuid.UUID `json:"reader_id" validate:"required"`
}

type ReturnBookDTO struct {
	BookID   uuid.UUID `json:"book_id" validate:"required"`
	ReaderID uuid.UUID `json:"reader_id" validate:"required"`
}

type CreateUserGroupDTO struct {
	Name        string        `json:"name" validate:"required"`
	Type        UserGroupType `json:"type" validate:"required"`
	Description *string       `json:"description,omitempty"`
	Color       *string       `json:"color,omitempty"`
	MaxBooks    int           `json:"max_books"`
	LoanDays    int           `json:"loan_days"`
	CanDownload bool          `json:"can_download"`
	CategoryIDs []uuid.UUID   `json:"category_ids,omitempty"`
}

type UpdateUserGroupDTO struct {
	Name        *string       `json:"name,omitempty"`
	Type        *UserGroupType `json:"type,omitempty"`
	Description *string       `json:"description,omitempty"`
	Color       *string       `json:"color,omitempty"`
	MaxBooks    *int          `json:"max_books,omitempty"`
	LoanDays    *int          `json:"loan_days,omitempty"`
	CanDownload *bool         `json:"can_download,omitempty"`
	IsActive    *bool         `json:"is_active,omitempty"`
	CategoryIDs []uuid.UUID   `json:"category_ids,omitempty"`
}

type CreateCategoryDTO struct {
	Name        string     `json:"name" validate:"required"`
	Slug        string     `json:"slug" validate:"required"`
	Description *string    `json:"description,omitempty"`
	Color       *string    `json:"color,omitempty"`
	Icon        *string    `json:"icon,omitempty"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
	SortOrder   int        `json:"sort_order"`
}

type UpdateCategoryDTO struct {
	Name        *string    `json:"name,omitempty"`
	Slug        *string    `json:"slug,omitempty"`
	Description *string    `json:"description,omitempty"`
	Color       *string    `json:"color,omitempty"`
	Icon        *string    `json:"icon,omitempty"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
	SortOrder   *int       `json:"sort_order,omitempty"`
	IsActive    *bool      `json:"is_active,omitempty"`
}

type GrantAccessDTO struct {
	UserID   uuid.UUID  `json:"user_id" validate:"required"`
	BookID   uuid.UUID  `json:"book_id" validate:"required"`
	Type     AccessType `json:"type" validate:"required"`
	Days     int        `json:"days" validate:"required,min=1"`
	Notes    *string    `json:"notes,omitempty"`
}

type UpdateAccessDTO struct {
	EndDate  *time.Time    `json:"end_date,omitempty"`
	Status   *AccessStatus `json:"status,omitempty"`
	Notes    *string       `json:"notes,omitempty"`
}

type UpdateReadingProgressDTO struct {
	CurrentPage int `json:"current_page" validate:"required,min=0"`
	TotalPages  int `json:"total_pages" validate:"required,min=1"`
}

type CreateSubscriptionDTO struct {
	UserID   uuid.UUID        `json:"user_id" validate:"required"`
	Plan     SubscriptionPlan `json:"plan" validate:"required"`
	Months   int              `json:"months" validate:"required,min=1"`
	Notes    *string          `json:"notes,omitempty"`
}

type UpdateUserDTO struct {
	Name     *string    `json:"name,omitempty" example:"John Doe"`
	Role     *UserRole  `json:"role,omitempty" example:"librarian"`
	GroupID  *uuid.UUID `json:"group_id,omitempty" example:"b8e7e72a-1c7b-4d7a-8f7a-8e7e72a1c7b5"`
	IsActive *bool      `json:"is_active,omitempty" example:"true"`
}

type ErrorResponseDTO struct {
	Error   string `json:"error" example:"Resource not found"`
	Message string `json:"message,omitempty" example:"The requested resource was not found on the server"`
}

type SuccessResponseDTO struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type PaginationDTO struct {
	Page     int   `json:"page" example:"1"`
	Limit    int   `json:"limit" example:"20"`
	Total    int64 `json:"total" example:"100"`
	LastPage int   `json:"last_page" example:"5"`
}

type ListResponseDTO struct {
	Data       interface{}    `json:"data"`
	Pagination *PaginationDTO `json:"pagination,omitempty"`
}

type UserResponseDTO struct {
	ID            uuid.UUID     `json:"id" example:"a8e7e72a-1c7b-4d7a-8f7a-8e7e72a1c7b4"`
	Email         string        `json:"email" example:"user@example.com"`
	Name          string        `json:"name" example:"John Doe"`
	Role          UserRole      `json:"role" example:"user"`
	GroupID       *uuid.UUID    `json:"group_id,omitempty" example:"b8e7e72a-1c7b-4d7a-8f7a-8e7e72a1c7b5"`
	Group         *UserGroup    `json:"group,omitempty"`
	AvatarURL     *string       `json:"avatar_url,omitempty" example:"https://example.com/avatar.png"`
	EmailVerified bool          `json:"email_verified" example:"true"`
	IsActive      bool          `json:"is_active" example:"true"`
	Subscription  *Subscription `json:"subscription,omitempty"`
	CreatedAt     time.Time     `json:"created_at" example:"2023-01-01T12:00:00Z"`
}

type BookAccessWithBook struct {
	BookAccess
	Book Book `json:"book"`
}

type BookReadingStats struct {
	BookID        uuid.UUID `json:"book_id"`
	TotalReaders  int64     `json:"total_readers"`
	TotalSessions int64     `json:"total_sessions"`
	TotalReadTime int64     `json:"total_read_time_seconds"`
	AvgReadTime   int64     `json:"avg_read_time_seconds"`
	AvgProgress   float64   `json:"avg_progress_percent"`
}

type UserLibraryDTO struct {
	ActiveBooks  []BookAccessWithBook `json:"active_books"`
	ExpiredBooks []BookAccessWithBook `json:"expired_books"`
	TotalBooks   int                  `json:"total_books"`
}

type DashboardStatsDTO struct {
	TotalUsers           int64 `json:"total_users"`
	TotalBooks           int64 `json:"total_books"`
	TotalCategories      int64 `json:"total_categories"`
	TotalGroups          int64 `json:"total_groups"`
	ActiveLoans          int64 `json:"active_loans"`
	ActiveSubscriptions  int64 `json:"active_subscriptions"`
	TotalReadingSessions int64 `json:"total_reading_sessions"`
}

type CreateCollectionDTO struct {
	Name        string `json:"name" validate:"required"`
	Description string `json:"description"`
}

type UpdateCollectionDTO struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

type AddBookToCollectionDTO struct {
	BookID uuid.UUID `json:"book_id" validate:"required"`
}

type CreateReviewDTO struct {
	BookID uuid.UUID `json:"book_id" validate:"required"`
	Rating int       `json:"rating" validate:"required,min=1,max=5"`
	Title  string    `json:"title"`
	Body   string    `json:"body"`
}

type UpdateReviewDTO struct {
	Rating *int    `json:"rating" validate:"omitempty,min=1,max=5"`
	Title  *string `json:"title"`
	Body   *string `json:"body"`
}

type CreateBookmarkDTO struct {
	BookID   uuid.UUID `json:"book_id" validate:"required"`
	Location string    `json:"location" validate:"required"`
	Label    string    `json:"label"`
}
