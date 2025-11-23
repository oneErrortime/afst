-- Создание таблицы пользователей (библиотекарей)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- Создание таблицы книг
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publication_year INTEGER CHECK (publication_year >= 0 AND publication_year <= 9999),
    isbn VARCHAR(20) UNIQUE,
    copies_count INTEGER NOT NULL DEFAULT 1 CHECK (copies_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_books_deleted_at ON books(deleted_at);
CREATE UNIQUE INDEX idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL AND deleted_at IS NULL;

-- Создание таблицы читателей
CREATE TABLE readers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_readers_deleted_at ON readers(deleted_at);
CREATE UNIQUE INDEX idx_readers_email ON readers(email) WHERE deleted_at IS NULL;

-- Создание таблицы выданных книг
CREATE TABLE borrowed_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id),
    reader_id UUID NOT NULL REFERENCES readers(id),
    borrow_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    return_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_borrowed_books_book_id ON borrowed_books(book_id);
CREATE INDEX idx_borrowed_books_reader_id ON borrowed_books(reader_id);
CREATE INDEX idx_borrowed_books_deleted_at ON borrowed_books(deleted_at);

-- Индекс для быстрого поиска активных выдач
CREATE INDEX idx_borrowed_books_active ON borrowed_books(reader_id, return_date) WHERE return_date IS NULL AND deleted_at IS NULL;