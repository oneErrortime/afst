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
  ListResponse,
  PaginationParams,
  User,
  UserGroup,
  CreateUserGroupRequest,
  UpdateUserGroupRequest,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanConfig,
  BookAccess,
  GrantAccessRequest,
  UpdateProgressRequest,
  UserLibrary,
  BookFile,
  ReadingSession,
  StartSessionRequest,
  BookReadingStats,
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

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export const booksApi = {
  getAll: async (params?: PaginationParams): Promise<Book[]> => {
    const response = await api.get<Book[] | ListResponse<Book>>('/books', { params });
    return Array.isArray(response.data) ? response.data : response.data.data;
  },

  getById: async (id: string): Promise<Book> => {
    const response = await api.get<Book>(`/books/${id}`);
    return response.data;
  },

  create: async (data: CreateBookRequest): Promise<Book> => {
    const response = await api.post<Book>('/books', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBookRequest): Promise<Book> => {
    const response = await api.put<Book>(`/books/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/books/${id}`);
  },

  getFiles: async (bookId: string): Promise<BookFile[]> => {
    const response = await api.get<ListResponse<BookFile>>(`/books/${bookId}/files`);
    return response.data.data;
  },

  uploadFile: async (bookId: string, file: File): Promise<BookFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BookFile>(`/books/${bookId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getStats: async (bookId: string): Promise<BookReadingStats> => {
    const response = await api.get<BookReadingStats>(`/books/${bookId}/stats`);
    return response.data;
  },
};

export const readersApi = {
  getAll: async (params?: PaginationParams): Promise<Reader[]> => {
    const response = await api.get<Reader[] | ListResponse<Reader>>('/readers', { params });
    return Array.isArray(response.data) ? response.data : response.data.data;
  },

  getById: async (id: string): Promise<Reader> => {
    const response = await api.get<Reader>(`/readers/${id}`);
    return response.data;
  },

  create: async (data: CreateReaderRequest): Promise<Reader> => {
    const response = await api.post<Reader>('/readers', data);
    return response.data;
  },

  update: async (id: string, data: UpdateReaderRequest): Promise<Reader> => {
    const response = await api.put<Reader>(`/readers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/readers/${id}`);
  },
};

export const borrowApi = {
  borrow: async (data: BorrowRequest): Promise<BorrowedBook> => {
    const response = await api.post<BorrowedBook>('/borrow', data);
    return response.data;
  },

  return: async (data: ReturnRequest): Promise<BorrowedBook> => {
    const response = await api.post<BorrowedBook>('/borrow/return', data);
    return response.data;
  },

  getByReader: async (readerId: string): Promise<BorrowedBook[]> => {
    const response = await api.get<BorrowedBook[] | ListResponse<BorrowedBook>>(`/borrow/reader/${readerId}`);
    return Array.isArray(response.data) ? response.data : response.data.data;
  },
};

export const groupsApi = {
  getAll: async (): Promise<UserGroup[]> => {
    const response = await api.get<ListResponse<UserGroup>>('/groups');
    return response.data.data;
  },

  getById: async (id: string): Promise<UserGroup> => {
    const response = await api.get<UserGroup>(`/groups/${id}`);
    return response.data;
  },

  create: async (data: CreateUserGroupRequest): Promise<UserGroup> => {
    const response = await api.post<UserGroup>('/groups', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserGroupRequest): Promise<UserGroup> => {
    const response = await api.put<UserGroup>(`/groups/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/groups/${id}`);
  },

  getUsers: async (groupId: string): Promise<User[]> => {
    const response = await api.get<ListResponse<User>>(`/groups/${groupId}/users`);
    return response.data.data;
  },

  assignUser: async (groupId: string, userId: string): Promise<void> => {
    await api.post(`/groups/${groupId}/users`, { user_id: userId });
  },
};

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<ListResponse<Category>>('/categories');
    return response.data.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Category> => {
    const response = await api.get<Category>(`/categories/slug/${slug}`);
    return response.data;
  },

  getChildren: async (parentId: string): Promise<Category[]> => {
    const response = await api.get<ListResponse<Category>>(`/categories/${parentId}/children`);
    return response.data.data;
  },

  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
    const response = await api.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

export const subscriptionsApi = {
  getPlans: async (): Promise<SubscriptionPlanConfig[]> => {
    const response = await api.get<ListResponse<SubscriptionPlanConfig>>('/subscription-plans');
    return response.data.data;
  },

  getMy: async (): Promise<Subscription> => {
    const response = await api.get<Subscription>('/subscriptions/my');
    return response.data;
  },

  subscribe: async (plan: SubscriptionPlan): Promise<Subscription> => {
    const response = await api.post<Subscription>('/subscriptions/subscribe', { plan });
    return response.data;
  },

  getById: async (id: string): Promise<Subscription> => {
    const response = await api.get<Subscription>(`/subscriptions/${id}`);
    return response.data;
  },

  cancel: async (id: string): Promise<void> => {
    await api.post(`/subscriptions/${id}/cancel`);
  },

  renew: async (id: string): Promise<void> => {
    await api.post(`/subscriptions/${id}/renew`);
  },
};

export const accessApi = {
  getLibrary: async (): Promise<UserLibrary> => {
    const response = await api.get<UserLibrary>('/access/library');
    return response.data;
  },

  checkAccess: async (bookId: string): Promise<boolean> => {
    const response = await api.get<{ has_access: boolean }>(`/access/check/${bookId}`);
    return response.data.has_access;
  },

  borrowBook: async (bookId: string): Promise<BookAccess> => {
    const response = await api.post<BookAccess>(`/access/borrow/${bookId}`);
    return response.data;
  },

  grantAccess: async (data: GrantAccessRequest): Promise<BookAccess> => {
    const response = await api.post<BookAccess>('/access', data);
    return response.data;
  },

  getById: async (id: string): Promise<BookAccess> => {
    const response = await api.get<BookAccess>(`/access/${id}`);
    return response.data;
  },

  revokeAccess: async (id: string): Promise<void> => {
    await api.post(`/access/${id}/revoke`);
  },

  updateProgress: async (id: string, data: UpdateProgressRequest): Promise<void> => {
    await api.put(`/access/${id}/progress`, data);
  },
};

export const filesApi = {
  getFile: async (fileId: string): Promise<Blob> => {
    const response = await api.get(`/files/${fileId}`, { responseType: 'blob' });
    return response.data;
  },

  getFileUrl: (fileId: string): string => {
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}/files/${fileId}`;
  },

  delete: async (fileId: string): Promise<void> => {
    await api.delete(`/files/${fileId}`);
  },
};

export const sessionsApi = {
  start: async (data: StartSessionRequest): Promise<ReadingSession> => {
    const response = await api.post<ReadingSession>('/reading-sessions', data);
    return response.data;
  },

  end: async (sessionId: string, endPage: number): Promise<void> => {
    await api.post(`/reading-sessions/${sessionId}/end`, { end_page: endPage });
  },

  getMy: async (): Promise<ReadingSession[]> => {
    const response = await api.get<ListResponse<ReadingSession>>('/reading-sessions/my');
    return response.data.data;
  },
};

export { api };
