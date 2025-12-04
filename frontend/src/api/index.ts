import api from './client';
import type {
  AuthRequest,
  AuthResponse,
  Book,
  CreateBookRequest,
  UpdateBookRequest,
  Reader,
  CreateReaderRequest,
  UpdateReaderRequest,
  BorrowedBook,
  BorrowRequest,
  ReturnRequest,
  ApiResponse,
  PaginationParams,
} from '@/types';

export const authApi = {
  register: async (data: AuthRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: AuthRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
};

export const booksApi = {
  getAll: async (params?: PaginationParams): Promise<ApiResponse<Book[]>> => {
    const response = await api.get<ApiResponse<Book[]>>('/books', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Book>> => {
    const response = await api.get<ApiResponse<Book>>(`/books/${id}`);
    return response.data;
  },

  create: async (data: CreateBookRequest): Promise<ApiResponse<Book>> => {
    const response = await api.post<ApiResponse<Book>>('/books', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBookRequest): Promise<ApiResponse<Book>> => {
    const response = await api.put<ApiResponse<Book>>(`/books/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/books/${id}`);
    return response.data;
  },
};

export const readersApi = {
  getAll: async (params?: PaginationParams): Promise<ApiResponse<Reader[]>> => {
    const response = await api.get<ApiResponse<Reader[]>>('/readers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Reader>> => {
    const response = await api.get<ApiResponse<Reader>>(`/readers/${id}`);
    return response.data;
  },

  create: async (data: CreateReaderRequest): Promise<ApiResponse<Reader>> => {
    const response = await api.post<ApiResponse<Reader>>('/readers', data);
    return response.data;
  },

  update: async (id: string, data: UpdateReaderRequest): Promise<ApiResponse<Reader>> => {
    const response = await api.put<ApiResponse<Reader>>(`/readers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/readers/${id}`);
    return response.data;
  },
};

export const borrowApi = {
  borrow: async (data: BorrowRequest): Promise<ApiResponse<BorrowedBook>> => {
    const response = await api.post<ApiResponse<BorrowedBook>>('/borrow', data);
    return response.data;
  },

  return: async (data: ReturnRequest): Promise<ApiResponse<BorrowedBook>> => {
    const response = await api.post<ApiResponse<BorrowedBook>>('/borrow/return', data);
    return response.data;
  },

  getByReader: async (readerId: string): Promise<ApiResponse<BorrowedBook[]>> => {
    const response = await api.get<ApiResponse<BorrowedBook[]>>(`/borrow/reader/${readerId}`);
    return response.data;
  },
};

export { api };
