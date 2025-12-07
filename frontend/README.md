# Digital Library Frontend

Modern React frontend для цифровой библиотеки с автоматической генерацией API клиента.

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Генерация API клиента
npm run api:generate:local

# Запуск dev сервера
npm run dev

# Build для production
npm run build
```

## 📋 Доступные команды

```bash
# Development
npm run dev                    # Запуск dev сервера (Vite)

# API Client Generation
npm run api:generate          # Генерация из http://localhost:8080/api/v1/swagger/doc.json
npm run api:generate:prod     # Генерация из https://afst-1.onrender.com/api/v1/swagger/doc.json
npm run api:generate:local    # Генерация из ../docs/swagger.json (рекомендуется)
npm run generate-api-client   # Алиас для api:generate:local

# Build & Deploy
npm run build                 # Production build с автогенерацией API
npm run preview               # Preview production build

# Code Quality
npm run lint                  # ESLint проверка
```

## 🏗️ Архитектура

```
frontend/
├── src/
│   ├── api/                   # API Layer
│   │   ├── wrapper.ts        # Полный wrapper для всех API endpoints
│   │   ├── adapter.ts        # Конфигурация и инициализация
│   │   ├── index.ts          # Единая точка входа
│   │   └── client.ts         # Legacy axios клиент
│   │
│   ├── shared/api/           # Автогенерированные файлы (НЕ РЕДАКТИРОВАТЬ!)
│   │   ├── core/             # OpenAPI core (request, OpenAPI config)
│   │   ├── models/           # TypeScript типы из OpenAPI
│   │   └── services/         # API сервисы из OpenAPI
│   │
│   ├── components/
│   │   ├── layout/           # Layout компоненты (Layout, Navbar)
│   │   └── ui/               # UI компоненты (Button, Input, Modal, etc.)
│   │
│   ├── pages/                # Страницы приложения
│   │   ├── Books.tsx
│   │   ├── BookDetail.tsx
│   │   ├── Collections.tsx
│   │   ├── Login.tsx
│   │   └── ...
│   │
│   ├── hooks/
│   │   └── useAPI.ts         # Типобезопасные React хуки
│   │
│   ├── store/                # Zustand stores
│   │   ├── authStore.ts
│   │   └── apiConfigStore.ts
│   │
│   ├── types/                # TypeScript типы
│   ├── examples/             # Примеры использования API
│   ├── App.tsx               # Главный компонент
│   └── main.tsx              # Entry point
│
├── docs/                     # Документация
├── API_GUIDE.md             # Полное руководство по API
└── package.json
```

## 🔌 API Integration

### Автоматическая генерация

API клиент автоматически генерируется из OpenAPI спецификации:

```bash
# Локальная генерация (рекомендуется для разработки)
npm run api:generate:local

# Из running backend
npm run api:generate

# Из production
npm run api:generate:prod
```

### Использование API

```typescript
import { booksApi, useQuery, useMutation } from '@/api';

// Простой запрос
const books = await booksApi.getAll({ limit: 20 });

// С React хуками
function BooksList() {
  const { data, loading, error } = useQuery(
    () => booksApi.getAll(),
    []
  );

  if (loading) return <div>Loading...</div>;
  return <div>{data?.map(book => ...)}</div>;
}

// Мутации
function CreateBook() {
  const { mutate, loading } = useMutation(
    (data) => booksApi.create(data),
    {
      onSuccess: (book) => console.log('Created:', book),
    }
  );

  return <button onClick={() => mutate({...})}>Create</button>;
}
```

### Доступные API модули

- **authApi** - Аутентификация (login, register, getMe)
- **booksApi** - Книги (CRUD, files, stats, recommendations)
- **collectionsApi** - Коллекции (CRUD, add/remove books)
- **reviewsApi** - Отзывы (CRUD)
- **bookmarksApi** - Закладки (create, delete)
- **socialApi** - Социальные функции (follow, profile)
- **usersApi** - Пользователи (CRUD, admin)
- **readersApi** - Читатели (CRUD)
- **borrowApi** - Выдача книг (borrow, return)
- **categoriesApi** - Категории (CRUD, children)
- **groupsApi** - Группы пользователей (CRUD, assign)
- **subscriptionsApi** - Подписки (plans, subscribe, cancel)
- **accessApi** - Доступ к книгам (grant, revoke, progress)
- **filesApi** - Файлы (upload, download, delete)
- **sessionsApi** - Сессии чтения (start, end)

**Полная документация**: [API_GUIDE.md](./API_GUIDE.md)

## 🔧 Конфигурация

### Environment Variables

Создайте `.env` файл:

```env
# API URL
VITE_API_URL=http://localhost:8080/api/v1

# или для production
VITE_API_URL=https://afst-1.onrender.com/api/v1
```

### API Configuration

API автоматически инициализируется при запуске приложения в `App.tsx`:

```typescript
import { initializeApiSystem } from '@/api';

useEffect(() => {
  initializeApiSystem();
}, []);
```

Для кастомной конфигурации:

```typescript
import { updateApiConfig, setAuthToken } from '@/api';

updateApiConfig({
  baseUrl: 'https://custom-api.com/api/v1',
});

setAuthToken('your-token');
```

## 🎣 React Hooks

### useQuery

Для GET запросов:

```typescript
const { data, loading, error, refetch } = useQuery(
  () => booksApi.getAll(),
  [],
  {
    enabled: true,
    refetchInterval: 5000,
    onSuccess: (data) => console.log(data),
    onError: (error) => console.error(error),
  }
);
```

### useMutation

Для POST/PUT/DELETE запросов:

```typescript
const { mutate, loading, error } = useMutation(
  (data) => booksApi.create(data),
  {
    onSuccess: (book) => console.log('Created:', book),
    onError: (error) => console.error(error),
  }
);
```

### usePaginatedQuery

Для пагинации:

```typescript
const { data, loading, hasMore, loadMore } = usePaginatedQuery(
  (page, limit) => booksApi.getAll({ offset: (page - 1) * limit, limit }),
  1,
  20
);
```

### useInfiniteQuery

Для infinite scroll:

```typescript
const { data, loading, hasMore, loadMore } = useInfiniteQuery(
  (offset, limit) => booksApi.getAll({ offset, limit }),
  20
);
```

### useDebounce

Для debounced search:

```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

const { data } = useQuery(
  () => booksApi.getAll({ search: debouncedSearch }),
  [debouncedSearch]
);
```

## 🔒 Аутентификация

Токены управляются автоматически:

```typescript
// Login
const response = await authApi.login(email, password);

// Logout
authApi.logout();

// Get current user
const user = await authApi.getMe();

// Manual token management
import { setAuthToken, getAuthToken, clearApiToken } from '@/api';

setAuthToken('token');
const token = getAuthToken();
clearApiToken();
```

При 401 ошибке происходит автоматический редирект на `/afst/login`.

## 📦 Build & Deploy

### Development Build

```bash
npm run dev
```

Запускает Vite dev server на `http://localhost:5173/afst`

### Production Build

```bash
npm run build
```

Создает production build в `dist/`:
- Автоматически генерирует API клиент из production endpoint
- TypeScript type checking
- Minification и optimization
- Code splitting

### Preview Production Build

```bash
npm run preview
```

## 🧪 Примеры использования

Полные рабочие примеры доступны в `src/examples/ApiExamples.tsx`:

- BasicQueryExample - Простые GET запросы
- MutationExample - Создание данных
- PaginatedExample - Пагинация
- InfiniteScrollExample - Infinite scroll
- SearchWithDebounceExample - Debounced search
- ConditionalQueryExample - Условные запросы
- MultipleQueriesExample - Множественные запросы
- OptimisticUpdateExample - Оптимистичные обновления
- RefetchIntervalExample - Автообновление
- ErrorHandlingExample - Обработка ошибок
- FileUploadExample - Загрузка файлов

## 🔄 Workflow при изменении Backend API

1. Backend обновляет OpenAPI спецификацию
2. Генерируется новый `swagger.json`:
   ```bash
   # В backend директории
   swag init
   ```
3. Frontend регенерирует API клиент:
   ```bash
   cd frontend
   npm run api:generate:local
   ```
4. TypeScript автоматически показывает breaking changes
5. Обновляете код согласно новым типам
6. Все работает! 🎉

## 🛠️ Troubleshooting

### Типы не обновляются

```bash
rm -rf src/shared/api
npm run api:generate:local
```

### 401 Errors

Проверьте токен:

```typescript
import { getAuthToken } from '@/api';
console.log(getAuthToken());
```

### CORS ошибки

Убедитесь, что backend разрешает CORS для вашего origin:

```go
// backend
config := cors.DefaultConfig()
config.AllowOrigins = []string{"http://localhost:5173"}
```

### Build ошибки

Очистите кэш и переустановите зависимости:

```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

## 📚 Дополнительные ресурсы

- [API Guide](./API_GUIDE.md) - Полное руководство по API
- [OpenAPI TypeScript Codegen](https://github.com/ferdikoomen/openapi-typescript-codegen)
- [Vite Documentation](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contributing

1. Создайте feature branch
2. Сделайте изменения
3. Запустите `npm run lint`
4. Создайте Pull Request

## 📝 License

MIT
