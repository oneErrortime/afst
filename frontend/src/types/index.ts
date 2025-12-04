export type UserRole = 'admin' | 'librarian' | 'reader';
export type UserGroupType = 'student' | 'free' | 'subscriber';
export type BookStatus = 'draft' | 'published' | 'archived';
export type FileType = 'pdf' | 'epub' | 'mobi';
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'student';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type AccessType = 'loan' | 'purchase' | 'subscription' | 'trial';
export type AccessStatus = 'active' | 'expired' | 'revoked' | 'returned';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  group_id?: string;
  group?: UserGroup;
  avatar_url?: string;
  email_verified: boolean;
  is_active: boolean;
  last_login_at?: string;
  subscription?: Subscription;
  created_at: string;
  updated_at?: string;
}

export interface UserGroup {
  id: string;
  name: string;
  type: UserGroupType;
  description?: string;
  color?: string;
  max_books: number;
  loan_days: number;
  can_download: boolean;
  is_active: boolean;
  allowed_categories?: Category[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  parent?: Category;
  children?: Category[];
  sort_order: number;
  is_active: boolean;
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
  cover_url?: string;
  language?: string;
  page_count?: number;
  publisher?: string;
  status: BookStatus;
  is_premium: boolean;
  view_count: number;
  download_count: number;
  rating: number;
  categories?: Category[];
  files?: BookFile[];
  created_at: string;
  updated_at: string;
}

export interface BookFile {
  id: string;
  book_id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_type: FileType;
  file_size: number;
  mime_type: string;
  hash: string;
  is_processed: boolean;
  page_count: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  max_books: number;
  max_downloads: number;
  can_access_premium: boolean;
  auto_renew: boolean;
  price: number;
  currency: string;
  created_at: string;
}

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
