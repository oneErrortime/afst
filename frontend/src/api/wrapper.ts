import { 
  AuthService,
  BooksService,
  BookmarksService,
  CollectionsService,
  ReviewsService,
  SocialService,
  UsersService,
  OpenAPI
} from '@/shared/api';
import axios, { AxiosInstance } from 'axios';
import type {
  CreateReaderDTO,
  UpdateReaderDTO,
  BorrowRequestDTO,
  ReturnRequestDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateGroupDTO,
  UpdateGroupDTO,
  SubscribePlanDTO,
  GrantAccessDTO,
  UpdateProgressDTO,
  StartSessionDTO,
} from './types';
import type {
  models_User,
  models_UserPublicProfileDTO,
  models_CreateBookDTO,
  models_UpdateBookDTO,
  models_CreateCollectionDTO,
  models_UpdateCollectionDTO,
  models_CreateReviewDTO,
  models_UpdateReviewDTO,
  models_CreateBookmarkDTO,
  models_UpdateUserDTO,
  handlers_CreateAdminRequest,
} from '@/shared/api';

export type {
  models_Book as Book,
  models_BookFile as BookFile,
  models_Bookmark as Bookmark,
  models_BookStatus as BookStatus,
  models_Category as Category,
  models_Collection as Collection,
  models_CreateBookDTO as CreateBookDTO,
  models_CreateBookmarkDTO as CreateBookmarkDTO,
  models_CreateCollectionDTO as CreateCollectionDTO,
  models_CreateReviewDTO as CreateReviewDTO,
  models_FileType as FileType,
  models_Review as Review,
  models_Subscription as Subscription,
  models_SubscriptionPlan as SubscriptionPlan,
  models_SubscriptionStatus as SubscriptionStatus,
  models_UpdateBookDTO as UpdateBookDTO,
  models_UpdateCollectionDTO as UpdateCollectionDTO,
  models_UpdateReviewDTO as UpdateReviewDTO,
  models_UpdateUserDTO as UpdateUserDTO,
  models_User as User,
  models_UserGroup as UserGroup,
  models_UserGroupType as UserGroupType,
  models_UserResponseDTO as UserResponseDTO,
  models_UserRole as UserRole,
  models_AddBookToCollectionDTO as AddBookToCollectionDTO,
  models_AuthRequestDTO as AuthRequestDTO,
  models_AuthResponseDTO as AuthResponseDTO,
} from '@/shared/api';

export type UserPublicProfileDTO = models_UserPublicProfileDTO;

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:8080/api/v1';
  }
  return 'https://afst-4.onrender.com/api/v1';
};

OpenAPI.BASE = getBaseUrl();

const token = localStorage.getItem('token');
if (token) {
  OpenAPI.TOKEN = token;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/afst/login';
    }
    throw error;
  }
);

const handleApiError = (error: any): never => {
  console.error('API Error:', error);
  if (error?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/afst/login';
  }
  throw error;
};

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await AuthService.postAuthLogin({ email, password });
      if (response.token) {
        localStorage.setItem('token', response.token);
        OpenAPI.TOKEN = response.token;
      }
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  register: async (email: string, password: string, name?: string) => {
    try {
      const response = await AuthService.postAuthRegister({ email, password, name });
      if (response.token) {
        localStorage.setItem('token', response.token);
        OpenAPI.TOKEN = response.token;
      }
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getMe: async () => {
    try {
      return await AuthService.getAuthMe();
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    OpenAPI.TOKEN = undefined;
    window.location.href = '/afst/login';
  },
};

export const booksApi = {
  getAll: async (params?: { limit?: number; offset?: number; search?: string }) => {
    try {
      const response = await BooksService.getBooks(params?.limit, params?.offset);
      return response.Data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getById: async (id: string) => {
    try {
      return await BooksService.getBooks1(id);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (data: models_CreateBookDTO) => {
    try {
      const response = await BooksService.postBooks(data);
      return response.Data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  update: async (id: string, data: models_UpdateBookDTO) => {
    try {
      const response = await BooksService.putBooks(id, data);
      return response.Data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async (id: string) => {
    try {
      return await BooksService.deleteBooks(id);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getRecommendations: async (id: string, limit: number = 6) => {
    try {
      const response = await BooksService.getBooksRecommendations(id, limit);
      return response.Data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getFiles: async (bookId: string) => {
    try {
      const response = await axiosInstance.get(`/books/${bookId}/files`);
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  uploadFile: async (bookId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosInstance.post(`/books/${bookId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getStats: async (bookId: string) => {
    try {
      const response = await axiosInstance.get(`/books/${bookId}/stats`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const collectionsApi = {
  getMyCollections: async () => {
    try {
      return await CollectionsService.getCollections();
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getById: async (id: string) => {
    try {
      return await CollectionsService.getCollections1(id);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (data: models_CreateCollectionDTO) => {
    try {
      return await CollectionsService.postCollections(data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  update: async (id: string, data: models_UpdateCollectionDTO) => {
    try {
      return await CollectionsService.putCollections(id, data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async (id: string) => {
    try {
      return await CollectionsService.deleteCollections(id);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  addBook: async (id: string, bookId: string) => {
    try {
      return await CollectionsService.postCollectionsBooks(id, { book_id: bookId });
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  removeBook: async (id: string, bookId: string) => {
    try {
      return await CollectionsService.deleteCollectionsBooks(id, bookId);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const reviewsApi = {
  getByBook: async (bookId: string) => {
    try {
      return await ReviewsService.getReviewsBook(bookId);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (data: models_CreateReviewDTO) => {
    try {
      return await ReviewsService.postReviews(data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  update: async (id: string, data: models_UpdateReviewDTO) => {
    try {
      return await ReviewsService.putReviews(id, data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async (id: string) => {
    try {
      return await ReviewsService.deleteReviews(id);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const bookmarksApi = {
  getAll: async () => {
    try {
        const response = await axiosInstance.get('/bookmarks');
        return response.data || [];
    } catch (error) {
        return handleApiError(error);
    }
  },

  getByBook: async (bookId: string) => {
    try {
      return await BookmarksService.getBookmarksBook(bookId);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (data: models_CreateBookmarkDTO) => {
    try {
      return await BookmarksService.postBookmarks(data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async (id: string) => {
    try {
      return await BookmarksService.deleteBookmarks(id);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const socialApi = {
  getUserProfile: async (id: string) => {
    try {
      return await SocialService.getUsersProfile(id);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  followUser: async (id: string) => {
    try {
      return await SocialService.postUsersFollow(id);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  unfollowUser: async (id: string) => {
    try {
      return await SocialService.deleteUsersFollow(id);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const usersApi = {
  getAll: async (params?: { limit?: number; offset?: number }) => {
    try {
      const response = await UsersService.getUsers(params?.limit, params?.offset);
      return response.Data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  update: async (id: string, data: models_UpdateUserDTO) => {
    try {
      return await UsersService.putUsers(id, data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  createAdmin: async (data: handlers_CreateAdminRequest) => {
    try {
      return await UsersService.postUsersAdmin(data);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const statsApi = {
  getDashboardStats: async () => {
    try {
      const response = await axiosInstance.get('/stats/dashboard');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const readersApi = {
  getAll: async (params?: { limit?: number; offset?: number }) => {
    try {
      const response = await axiosInstance.get('/readers', { params });
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/readers/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (data: CreateReaderDTO) => {
    try {
      const response = await axiosInstance.post('/readers', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  update: async (id: string, data: UpdateReaderDTO) => {
    try {
      const response = await axiosInstance.put(`/readers/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async (id: string) => {
    try {
      await axiosInstance.delete(`/readers/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const borrowApi = {
  borrow: async (data: BorrowRequestDTO) => {
    try {
      const response = await axiosInstance.post('/borrow', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  return: async (data: ReturnRequestDTO) => {
    try {
      const response = await axiosInstance.post('/borrow/return', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getByReader: async (readerId: string) => {
    try {
      const response = await axiosInstance.get(`/borrow/reader/${readerId}`);
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const categoriesApi = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/categories');
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getBySlug: async (slug: string) => {
    try {
      const response = await axiosInstance.get(`/categories/slug/${slug}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getChildren: async (parentId: string) => {
    try {
      const response = await axiosInstance.get(`/categories/${parentId}/children`);
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (data: CreateCategoryDTO) => {
    try {
      const response = await axiosInstance.post('/categories', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  update: async (id: string, data: any) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async (id: string) => {
    try {
      await axiosInstance.delete(`/categories/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const groupsApi = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/groups');
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/groups/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (data: CreateGroupDTO) => {
    try {
      const response = await axiosInstance.post('/groups', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  update: async (id: string, data: UpdateGroupDTO) => {
    try {
      const response = await axiosInstance.put(`/groups/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async (id: string) => {
    try {
      await axiosInstance.delete(`/groups/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getUsers: async (groupId: string) => {
    try {
      const response = await axiosInstance.get(`/groups/${groupId}/users`);
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  assignUser: async (groupId: string, userId: string) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/users`, { user_id: userId });
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const subscriptionsApi = {
  getPlans: async () => {
    try {
      const response = await axiosInstance.get('/subscription-plans');
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getMy: async () => {
    try {
      const response = await axiosInstance.get('/subscriptions/my');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  subscribe: async (plan: string) => {
    try {
      const response = await axiosInstance.post('/subscriptions/subscribe', { plan });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/subscriptions/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  cancel: async (id: string) => {
    try {
      await axiosInstance.post(`/subscriptions/${id}/cancel`);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  renew: async (id: string) => {
    try {
      await axiosInstance.post(`/subscriptions/${id}/renew`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  createAdmin: async (userId: string, plan: string) => {
    try {
        const response = await axiosInstance.post('/subscriptions', { user_id: userId, plan });
        return response.data;
    } catch (error) {
        return handleApiError(error);
    }
  },
};

export const accessApi = {
  getLibrary: async () => {
    try {
      const response = await axiosInstance.get('/access/library');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  checkAccess: async (bookId: string) => {
    try {
      const response = await axiosInstance.get(`/access/check/${bookId}`);
      return response.data.has_access || false;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  borrowBook: async (bookId: string) => {
    try {
      const response = await axiosInstance.post(`/access/borrow/${bookId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  grantAccess: async (data: GrantAccessDTO) => {
    try {
      const response = await axiosInstance.post('/access', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/access/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  revokeAccess: async (id: string) => {
    try {
      await axiosInstance.post(`/access/${id}/revoke`);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  updateProgress: async (id: string, data: UpdateProgressDTO) => {
    try {
      await axiosInstance.put(`/access/${id}/progress`, data);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const filesApi = {
  getFile: async (fileId: string) => {
    try {
      const response = await axiosInstance.get(`/files/${fileId}`, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getFileUrl: (fileId: string): string => {
    return `${getBaseUrl()}/files/${fileId}`;
  },
  
  delete: async (fileId: string) => {
    try {
      await axiosInstance.delete(`/files/${fileId}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const sessionsApi = {
  start: async (data: StartSessionDTO) => {
    try {
      const response = await axiosInstance.post('/reading-sessions', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  end: async (sessionId: string, endPage: number) => {
    try {
      await axiosInstance.post(`/reading-sessions/${sessionId}/end`, { end_page: endPage });
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getMy: async () => {
    try {
      const response = await axiosInstance.get('/reading-sessions/my');
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
    OpenAPI.TOKEN = token;
  } else {
    localStorage.removeItem('token');
    OpenAPI.TOKEN = undefined;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export { OpenAPI };
