import type {
  models_User,
  models_UserGroup,
  models_Category,
  models_Book,
  models_BookFile,
  models_Subscription,
  models_Collection,
  models_Review,
  models_Bookmark,
} from '@/shared/api';

export type UserRole = 'admin' | 'librarian' | 'reader';
export type UserGroupType = 'student' | 'free' | 'subscriber';
export type BookStatus = 'draft' | 'published' | 'archived';
export type FileType = 'pdf' | 'epub' | 'mobi';
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'student';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export type AccessType = 'loan' | 'purchase' | 'subscription' | 'trial';
export type AccessStatus = 'active' | 'expired' | 'revoked' | 'returned';

export type User = Omit<models_User, 'id' | 'email' | 'name' | 'role'> & {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type UserGroup = Omit<models_UserGroup, 'id' | 'name' | 'type' | 'max_books' | 'loan_days' | 'can_download' | 'allowed_categories'> & {
  id: string;
  name: string;
  type: UserGroupType;
  max_books: number;
  loan_days: number;
  can_download: boolean;
  allowed_categories?: Category[];
};

export type Category = Omit<models_Category, 'id' | 'name' | 'slug' | 'sort_order'> & {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Book = Omit<models_Book, 'id' | 'title' | 'author' | 'copies_count' | 'rating' | 'created_at' | 'status' | 'files' | 'categories'> & {
  id: string;
  title: string;
  author: string;
  copies_count: number;
  rating: number;
  created_at: string;
  status: BookStatus;
  files?: BookFile[];
  categories?: Category[];
};

export type BookFile = Omit<models_BookFile, 'id' | 'book_id' | 'file_name' | 'file_size' | 'page_count' | 'file_type'> & {
  id: string;
  book_id: string;
  file_name: string;
  file_size: number;
  page_count: number;
  file_type: FileType;
};

export type Subscription = Omit<models_Subscription, 'id' | 'user_id' | 'plan' | 'status' | 'end_date' | 'max_books' | 'max_downloads' | 'can_access_premium'> & {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  end_date: string;
  max_books: number;
  max_downloads: number;
  can_access_premium: boolean;
};

export interface SubscriptionPlanConfig {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_books: number;
  max_downloads: number;
  can_access_premium: boolean;
  features?: string[];
}

export interface BookAccess {
  id: string;
  user_id: string;
  book_id: string;
  type: AccessType;
  status: AccessStatus;
  start_date: string;
  end_date: string;
  last_accessed_at?: string;
  read_progress: number;
  current_page: number;
  total_read_time: number;
  granted_by?: string;
  book?: Book;
  user?: User;
  created_at: string;
}

export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: string;
  access_id: string;
  started_at: string;
  ended_at?: string;
  start_page: number;
  end_page: number;
  duration: number;
  device_type: string;
  book?: Book;
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
  name?: string;
}

export interface AuthResponse {
  token: string;
  user?: User;
  message?: string;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  publication_year?: number;
  isbn?: string;
  copies_count: number;
  description?: string;
  cover_url?: string;
  language?: string;
  page_count?: number;
  publisher?: string;
  is_premium?: boolean;
  category_ids?: string[];
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  publication_year?: number;
  isbn?: string;
  copies_count?: number;
  description?: string;
  cover_url?: string;
  language?: string;
  page_count?: number;
  publisher?: string;
  status?: BookStatus;
  is_premium?: boolean;
  category_ids?: string[];
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

export interface CreateUserGroupRequest {
  name: string;
  type: UserGroupType;
  description?: string;
  color?: string;
  max_books: number;
  loan_days: number;
  can_download: boolean;
  category_ids?: string[];
}

export interface UpdateUserGroupRequest {
  name?: string;
  type?: UserGroupType;
  description?: string;
  color?: string;
  max_books?: number;
  loan_days?: number;
  can_download?: boolean;
  is_active?: boolean;
  category_ids?: string[];
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface GrantAccessRequest {
  user_id: string;
  book_id: string;
  type: AccessType;
  days: number;
  notes?: string;
}

export interface UpdateProgressRequest {
  current_page: number;
  total_pages: number;
}

export interface StartSessionRequest {
  book_id: string;
  access_id: string;
}

export interface UserLibrary {
  active_books: BookAccess[];
  expired_books: BookAccess[];
  total_books: number;
}

export interface BookReadingStats {
  book_id: string;
  total_readers: number;
  total_sessions: number;
  total_read_time_seconds: number;
  avg_read_time_seconds: number;
  avg_progress_percent: number;
}

export interface DashboardStats {
  total_users: number;
  total_books: number;
  total_categories: number;
  total_groups: number;
  active_loans: number;
  active_subscriptions: number;
  total_reading_sessions: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
}

export interface ListResponse<T> {
  data: T[];
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  last_page: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export type Collection = Omit<models_Collection, 'id' | 'user_id' | 'name' | 'books'> & {
  id: string;
  user_id: string;
  name: string;
  books?: Book[];
};

export interface CreateCollectionRequest {
  name: string;
  description?: string;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
}

export interface AddBookToCollectionRequest {
  book_id: string;
}

export type Review = Omit<models_Review, 'id' | 'user_id' | 'book_id' | 'rating' | 'user'> & {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  user?: User;
};

export interface CreateReviewRequest {
  book_id: string;
  rating: number;
  title?: string;
  body?: string;
}

export type Bookmark = models_Bookmark & {
  id: string;
  user_id: string;
  book_id: string;
};

export interface CreateBookmarkRequest {
  book_id: string;
  location: string;
  label?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  body?: string;
}
