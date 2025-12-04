export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  publication_year?: number;
  isbn?: string;
  copies_count: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Reader {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface BorrowedBook {
  id: string;
  book_id: string;
  reader_id: string;
  borrow_date: string;
  return_date?: string;
  created_at: string;
  updated_at: string;
  book?: Book;
  reader?: Reader;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  message: string;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  publication_year?: number;
  isbn?: string;
  copies_count: number;
  description?: string;
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  publication_year?: number;
  isbn?: string;
  copies_count?: number;
  description?: string;
}

export interface CreateReaderRequest {
  name: string;
  email: string;
}

export interface UpdateReaderRequest {
  name?: string;
  email?: string;
}

export interface BorrowRequest {
  book_id: string;
  reader_id: string;
}

export interface ReturnRequest {
  book_id: string;
  reader_id: string;
}

export interface ApiResponse<T> {
  data?: T;
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
