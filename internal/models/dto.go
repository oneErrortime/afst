package models

import "github.com/google/uuid"

// AuthRequestDTO для регистрации и входа
type AuthRequestDTO struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// AuthResponseDTO для ответа после аутентификации
type AuthResponseDTO struct {
	Token   string `json:"token"`
	Message string `json:"message"`
}

// CreateBookDTO для создания книги
type CreateBookDTO struct {
	Title           string  `json:"title" validate:"required"`
	Author          string  `json:"author" validate:"required"`
	PublicationYear *int    `json:"publication_year,omitempty" validate:"omitempty,gte=0,lte=9999"`
	ISBN            *string `json:"isbn,omitempty"`
	CopiesCount     int     `json:"copies_count" validate:"gte=0"`
	Description     *string `json:"description,omitempty"`
}

// UpdateBookDTO для обновления книги
type UpdateBookDTO struct {
	Title           *string `json:"title,omitempty"`
	Author          *string `json:"author,omitempty"`
	PublicationYear *int    `json:"publication_year,omitempty" validate:"omitempty,gte=0,lte=9999"`
	ISBN            *string `json:"isbn,omitempty"`
	CopiesCount     *int    `json:"copies_count,omitempty" validate:"omitempty,gte=0"`
	Description     *string `json:"description,omitempty"`
}

// CreateReaderDTO для создания читателя
type CreateReaderDTO struct {
	Name  string `json:"name" validate:"required"`
	Email string `json:"email" validate:"required,email"`
}

// UpdateReaderDTO для обновления читателя
type UpdateReaderDTO struct {
	Name  *string `json:"name,omitempty"`
	Email *string `json:"email,omitempty" validate:"omitempty,email"`
}

// BorrowBookDTO для выдачи книги
type BorrowBookDTO struct {
	BookID   uuid.UUID `json:"book_id" validate:"required"`
	ReaderID uuid.UUID `json:"reader_id" validate:"required"`
}

// ReturnBookDTO для возврата книги
type ReturnBookDTO struct {
	BookID   uuid.UUID `json:"book_id" validate:"required"`
	ReaderID uuid.UUID `json:"reader_id" validate:"required"`
}

// ErrorResponseDTO для ошибок
type ErrorResponseDTO struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// SuccessResponseDTO для успешных операций
type SuccessResponseDTO struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
