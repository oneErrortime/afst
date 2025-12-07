# API Integration Guide

## Обзор

Проект использует автоматическую генерацию API клиента из OpenAPI спецификации с полным wrapper слоем для типобезопасности и удобства использования.

## Архитектура

```
frontend/src/
├── shared/api/          # Автогенерированные сервисы (не редактировать!)
│   ├── core/           # OpenAPI core
│   ├── models/         # TypeScript типы
│   └── services/       # API сервисы
├── api/
│   ├── wrapper.ts      # Wrapper с полным покрытием API
│   ├── adapter.ts      # Конфигурация и инициализация
│   └── index.ts        # Единая точка входа
└── hooks/
    └── useAPI.ts       # Типобезопасные React хуки
```

## Генерация API клиента

### Доступные команды:

```bash
# Генерация из локального swagger.json
npm run api:generate:local

# Генерация из dev сервера
npm run api:generate

# Генерация из production
npm run api:generate:prod

# Автоматически при dev
npm run dev

# Автоматически при build
npm run build
```

### Автоматическая регенерация:

При изменении backend API:

1. Обновите `docs/swagger.json` или запустите backend
2. Выполните `npm run api:generate:local` или `npm run api:generate`
3. Автогенерированные файлы обновятся в `src/shared/api`
4. Wrapper автоматически использует новые типы

## Использование API

### Базовое использование

```typescript
import { booksApi, authApi, collectionsApi } from '@/api';

const books = await booksApi.getAll({ limit: 20, offset: 0 });

const user = await authApi.login('email@example.com', 'password');

const collection = await collectionsApi.create({
  name: 'My Collection',
  description: 'Test',
});
```

### С React хуками

```typescript
import { useQuery, useMutation } from '@/api';
import { booksApi, Book } from '@/api';

function BooksList() {
  const { data: books, loading, error, refetch } = useQuery<Book[]>(
    () => booksApi.getAll(),
    []
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {books?.map(book => (
        <div key={book.id}>{book.title}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Мутации с хуками

```typescript
import { useMutation, booksApi, CreateBookDTO } from '@/api';

function CreateBook() {
  const { mutate, loading, error } = useMutation<Book, CreateBookDTO>(
    (data) => booksApi.create(data),
    {
      onSuccess: (book) => {
        console.log('Book created:', book);
      },
      onError: (error) => {
        console.error('Failed to create book:', error);
      }
    }
  );

  const handleSubmit = () => {
    mutate({
      title: 'New Book',
      author: 'Author Name',
      isbn: '1234567890',
    });
  };

  return (
    <button onClick={handleSubmit} disabled={loading}>
      {loading ? 'Creating...' : 'Create Book'}
    </button>
  );
}
```

### Пагинация

```typescript
import { usePaginatedQuery, booksApi, Book } from '@/api';

function PaginatedBooks() {
  const {
    data: books,
    loading,
    hasMore,
    loadMore,
    reset
  } = usePaginatedQuery<Book>(
    (page, limit) => booksApi.getAll({ offset: (page - 1) * limit, limit }),
    1,
    20
  );

  return (
    <div>
      {books.map(book => (
        <div key={book.id}>{book.title}</div>
      ))}
      
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Infinite Scroll

```typescript
import { useInfiniteQuery, booksApi } from '@/api';

function InfiniteBooks() {
  const {
    data: books,
    loading,
    hasMore,
    loadMore
  } = useInfiniteQuery(
    (offset, limit) => booksApi.getAll({ offset, limit }),
    20
  );

  return (
    <InfiniteScroll
      dataLength={books.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<div>Loading...</div>}
    >
      {books.map(book => (
        <div key={book.id}>{book.title}</div>
      ))}
    </InfiniteScroll>
  );
}
```

### Debounce для поиска

```typescript
import { useDebounce, useQuery, booksApi } from '@/api';
import { useState } from 'react';

function BookSearch() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data: books, loading } = useQuery(
    () => booksApi.getAll({ search: debouncedSearch }),
    [debouncedSearch],
    { enabled: debouncedSearch.length > 0 }
  );

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search books..."
      />
      
      {loading && <div>Searching...</div>}
      
      {books?.map(book => (
        <div key={book.id}>{book.title}</div>
      ))}
    </div>
  );
}
```

## Доступные API модули

### Auth API

```typescript
authApi.login(email, password)
authApi.register(email, password, name?)
authApi.getMe()
authApi.logout()
```

### Books API

```typescript
booksApi.getAll({ limit?, offset? })
booksApi.getById(id)
booksApi.create(data)
booksApi.update(id, data)
booksApi.delete(id)
booksApi.getRecommendations(id, limit?)
booksApi.getFiles(bookId)
booksApi.uploadFile(bookId, file)
booksApi.getStats(bookId)
```

### Collections API

```typescript
collectionsApi.getMyCollections()
collectionsApi.getById(id)
collectionsApi.create(data)
collectionsApi.update(id, data)
collectionsApi.delete(id)
collectionsApi.addBook(id, bookId)
collectionsApi.removeBook(id, bookId)
```

### Reviews API

```typescript
reviewsApi.getByBook(bookId)
reviewsApi.create(data)
reviewsApi.update(id, data)
reviewsApi.delete(id)
```

### Bookmarks API

```typescript
bookmarksApi.getByBook(bookId)
bookmarksApi.create(data)
bookmarksApi.delete(id)
```

### Social API

```typescript
socialApi.getUserProfile(id)
socialApi.followUser(id)
socialApi.unfollowUser(id)
```

### Users API

```typescript
usersApi.getAll({ limit?, offset? })
usersApi.update(id, data)
usersApi.createAdmin(data)
```

### Readers API

```typescript
readersApi.getAll({ limit?, offset? })
readersApi.getById(id)
readersApi.create(data)
readersApi.update(id, data)
readersApi.delete(id)
```

### Borrow API

```typescript
borrowApi.borrow(data)
borrowApi.return(data)
borrowApi.getByReader(readerId)
```

### Categories API

```typescript
categoriesApi.getAll()
categoriesApi.getById(id)
categoriesApi.getBySlug(slug)
categoriesApi.getChildren(parentId)
categoriesApi.create(data)
categoriesApi.update(id, data)
categoriesApi.delete(id)
```

### Groups API

```typescript
groupsApi.getAll()
groupsApi.getById(id)
groupsApi.create(data)
groupsApi.update(id, data)
groupsApi.delete(id)
groupsApi.getUsers(groupId)
groupsApi.assignUser(groupId, userId)
```

### Subscriptions API

```typescript
subscriptionsApi.getPlans()
subscriptionsApi.getMy()
subscriptionsApi.subscribe(plan)
subscriptionsApi.getById(id)
subscriptionsApi.cancel(id)
subscriptionsApi.renew(id)
```

### Access API

```typescript
accessApi.getLibrary()
accessApi.checkAccess(bookId)
accessApi.borrowBook(bookId)
accessApi.grantAccess(data)
accessApi.getById(id)
accessApi.revokeAccess(id)
accessApi.updateProgress(id, data)
```

### Files API

```typescript
filesApi.getFile(fileId)
filesApi.getFileUrl(fileId)
filesApi.delete(fileId)
```

### Sessions API

```typescript
sessionsApi.start(data)
sessionsApi.end(sessionId, endPage)
sessionsApi.getMy()
```

## Конфигурация

### Инициализация

API автоматически инициализируется в `App.tsx`, но можно настроить вручную:

```typescript
import { initializeApiSystem, updateApiConfig } from '@/api';

initializeApiSystem({
  baseUrl: 'https://custom-api.com/api/v1',
  token: 'custom-token',
});

updateApiConfig({
  baseUrl: 'https://new-api.com/api/v1',
});
```

### Управление токенами

```typescript
import { setAuthToken, getAuthToken, clearApiToken } from '@/api';

setAuthToken('new-token');

const token = getAuthToken();

clearApiToken();
```

### Обработка ошибок

Все API методы автоматически обрабатывают ошибки:

- **401 Unauthorized**: Автоматический редирект на `/afst/login`
- **403 Forbidden**: Логирование ошибки
- **404 Not Found**: Логирование ошибки
- **500+ Server Error**: Логирование ошибки

Для кастомной обработки:

```typescript
import { handleApiError } from '@/api';

try {
  const result = await booksApi.getById('123');
} catch (error) {
  handleApiError(error);
}
```

## TypeScript типы

Все типы автоматически экспортируются:

```typescript
import type {
  Book,
  User,
  Collection,
  Review,
  Bookmark,
  Category,
  UserGroup,
  Subscription,
  CreateBookDTO,
  UpdateBookDTO,
  AuthRequestDTO,
  AuthResponseDTO,
} from '@/api';
```

## Лучшие практики

### 1. Используйте хуки для компонентов

```typescript
const { data, loading, error } = useQuery(() => booksApi.getAll());
```

### 2. Оптимизация с refetchInterval

```typescript
const { data } = useQuery(
  () => booksApi.getAll(),
  [],
  { refetchInterval: 30000 }
);
```

### 3. Условная загрузка

```typescript
const { data } = useQuery(
  () => booksApi.getById(id),
  [id],
  { enabled: !!id }
);
```

### 4. Обработка успеха/ошибок в мутациях

```typescript
const { mutate } = useMutation(
  (data) => booksApi.create(data),
  {
    onSuccess: (book) => {
      showToast('Book created!');
      navigate(`/books/${book.id}`);
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, 'error');
    },
  }
);
```

### 5. Отмена запросов при размонтировании

Хуки автоматически отменяют запросы при размонтировании компонента.

## Миграция с старого API

### До:

```typescript
import { booksApi } from '@/api';

const response = await api.get('/books');
const books = response.data.data;
```

### После:

```typescript
import { booksApi } from '@/api';

const books = await booksApi.getAll();
```

## Troubleshooting

### Проблема: Типы не обновляются

**Решение**: Запустите регенерацию:

```bash
npm run api:generate:local
```

### Проблема: 401 ошибки

**Решение**: Проверьте токен:

```typescript
import { getAuthToken } from '@/api';
console.log(getAuthToken());
```

### Проблема: Неправильный base URL

**Решение**: Установите `VITE_API_URL` в `.env`:

```
VITE_API_URL=http://localhost:8080/api/v1
```

## Дополнительные ресурсы

- [OpenAPI TypeScript Codegen](https://github.com/ferdikoomen/openapi-typescript-codegen)
- [React Query](https://tanstack.com/query/latest) (похожий подход)
- [SWR](https://swr.vercel.app/) (альтернатива)
