export {
  authApi,
  booksApi,
  bookmarksApi,
  collectionsApi,
  reviewsApi,
  socialApi,
  usersApi,
  readersApi,
  borrowApi,
  categoriesApi,
  groupsApi,
  subscriptionsApi,
  accessApi,
  filesApi,
  sessionsApi,
  statsApi,
  setAuthToken,
  getAuthToken,
  OpenAPI,
} from './wrapper';

export type {
  Book,
  BookFile,
  Bookmark,
  BookStatus,
  Category,
  Collection,
  CreateBookDTO,
  CreateBookmarkDTO,
  CreateCollectionDTO,
  CreateReviewDTO,
  FileType,
  Review,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  UpdateBookDTO,
  UpdateCollectionDTO,
  UpdateReviewDTO,
  UpdateUserDTO,
  User,
  UserGroup,
  UserGroupType,
  UserPublicProfileDTO,
  UserResponseDTO,
  UserRole,
  AddBookToCollectionDTO,
  AuthRequestDTO,
  AuthResponseDTO,
} from './wrapper';

export type { CreateReaderDTO, UpdateReaderDTO, BorrowRequestDTO, ReturnRequestDTO } from './types';

export {
  initializeAPI,
  initializeApiSystem,
  setApiToken,
  getApiToken,
  clearApiToken,
  updateApiConfig,
  getApiConfig,
  setupAuthInterceptor,
  listenToStorageChanges,
  handleApiError,
} from './adapter';

export {
  useQuery,
  useMutation,
  usePaginatedQuery,
  useInfiniteQuery,
  useDebounce,
} from '@/hooks/useAPI';

export type {
  QueryOptions,
  QueryResult,
  MutationOptions,
  MutationResult,
} from '@/hooks/useAPI';
