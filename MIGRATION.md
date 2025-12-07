# План миграции на автогенерацию API

## 🎯 Цель

Перевести весь frontend на использование автогенерированного API клиента с полным wrapper слоем для обеспечения:
- ✅ Автоматической синхронизации с backend
- ✅ Типобезопасности
- ✅ Единой точки входа
- ✅ Автоматической аутентификации
- ✅ Полного покрытия функциональности

## 📊 Текущее состояние

### ✅ Готово

1. **Автогенерация настроена**
   - `npm run api:generate:local` - генерация из swagger.json
   - `npm run api:generate` - генерация из dev сервера
   - `npm run api:generate:prod` - генерация из production

2. **Wrapper создан** (`src/api/wrapper.ts`)
   - Все API endpoints покрыты:
     - ✅ Auth (login, register, getMe, logout)
     - ✅ Books (CRUD, files, stats, recommendations)
     - ✅ Collections (CRUD, add/remove books)
     - ✅ Reviews (CRUD)
     - ✅ Bookmarks (create, delete)
     - ✅ Social (profile, follow/unfollow)
     - ✅ Users (CRUD, admin)
     - ✅ Readers (CRUD)
     - ✅ Borrow (borrow, return, by reader)
     - ✅ Categories (CRUD, children, slug)
     - ✅ Groups (CRUD, users, assign)
     - ✅ Subscriptions (plans, subscribe, cancel, renew)
     - ✅ Access (library, check, grant, revoke, progress)
     - ✅ Files (get, url, delete)
     - ✅ Sessions (start, end, my)

3. **React хуки** (`src/hooks/useAPI.ts`)
   - ✅ useQuery - для GET запросов
   - ✅ useMutation - для POST/PUT/DELETE
   - ✅ usePaginatedQuery - для пагинации
   - ✅ useInfiniteQuery - для infinite scroll
   - ✅ useDebounce - для debounced search

4. **Adapter** (`src/api/adapter.ts`)
   - ✅ Автоматическая инициализация
   - ✅ Управление токенами
   - ✅ Auth interceptor
   - ✅ Storage listener
   - ✅ Error handling

5. **Инициализация** (`src/App.tsx`)
   - ✅ API система инициализируется при старте
   - ✅ Автоматическое добавление токенов
   - ✅ Автоматический редирект при 401

6. **Документация**
   - ✅ API_GUIDE.md - полное руководство
   - ✅ README.md - быстрый старт
   - ✅ ApiExamples.tsx - рабочие примеры

7. **CI/CD**
   - ✅ GitHub Actions workflow
   - ✅ Автоматическая генерация при build

## 📋 План миграции компонентов

### Этап 1: Подготовка (✅ ЗАВЕРШЕН)

- [x] Настроить автогенерацию
- [x] Создать wrapper
- [x] Создать хуки
- [x] Обновить App.tsx
- [x] Создать документацию

### Этап 2: Миграция критических модулей (3-4 часа)

#### 2.1 Auth модуль

**Файлы для обновления:**
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/store/authStore.ts`

**До:**
```typescript
import { authApi } from '@/api';
const response = await api.post('/auth/login', { email, password });
```

**После:**
```typescript
import { authApi } from '@/api';
const response = await authApi.login(email, password);
```

**Изменения:**
1. Заменить все `api.post('/auth/login')` на `authApi.login()`
2. Заменить `api.post('/auth/register')` на `authApi.register()`
3. Заменить `api.get('/auth/me')` на `authApi.getMe()`
4. Обновить типы с `AuthResponse` на импорт из `@/api`

**Оценка:** 30 минут

#### 2.2 Books модуль

**Файлы для обновления:**
- `src/pages/Books.tsx`
- `src/pages/BookDetail.tsx`
- `src/pages/AdminBooks.tsx`
- `src/pages/Library.tsx`

**До:**
```typescript
const response = await api.get('/books');
const books = response.data.data;
```

**После:**
```typescript
import { booksApi, useQuery } from '@/api';

const { data: books, loading, error } = useQuery(
  () => booksApi.getAll({ limit: 20 }),
  []
);
```

**Изменения:**
1. Заменить все прямые вызовы API на `booksApi.*`
2. Использовать `useQuery` для GET запросов
3. Использовать `useMutation` для CREATE/UPDATE/DELETE
4. Обновить типы на импорт из `@/api`

**Оценка:** 2 часа

#### 2.3 Collections модуль

**Файлы для обновления:**
- `src/pages/Collections.tsx`

**До:**
```typescript
const response = await api.get('/collections');
const collections = response.data;
```

**После:**
```typescript
import { collectionsApi, useQuery } from '@/api';

const { data: collections, loading } = useQuery(
  () => collectionsApi.getMyCollections(),
  []
);
```

**Изменения:**
1. Заменить API вызовы на `collectionsApi.*`
2. Использовать хуки
3. Обновить типы

**Оценка:** 1 час

#### 2.4 Reviews & Bookmarks

**Файлы для обновления:**
- `src/pages/BookDetail.tsx` (reviews section)
- Любые компоненты с bookmarks

**После:**
```typescript
import { reviewsApi, bookmarksApi, useMutation } from '@/api';

const { mutate: createReview } = useMutation(
  (data) => reviewsApi.create(data),
  {
    onSuccess: () => refetchReviews(),
  }
);
```

**Оценка:** 30 минут

### Этап 3: Миграция остальных модулей (2-3 часа)

#### 3.1 Readers & Borrow

**Файлы:**
- `src/pages/Readers.tsx`
- `src/pages/Borrow.tsx`

**После:**
```typescript
import { readersApi, borrowApi, useQuery } from '@/api';

const { data: readers } = useQuery(() => readersApi.getAll(), []);
```

**Оценка:** 1 час

#### 3.2 Categories & Groups

**Файлы:**
- `src/pages/Categories.tsx`
- `src/pages/Groups.tsx`

**После:**
```typescript
import { categoriesApi, groupsApi } from '@/api';

const categories = await categoriesApi.getAll();
const groups = await groupsApi.getAll();
```

**Оценка:** 1 час

#### 3.3 Subscriptions & Users

**Файлы:**
- `src/pages/Subscriptions.tsx`
- `src/pages/Users.tsx`

**После:**
```typescript
import { subscriptionsApi, usersApi } from '@/api';

const plans = await subscriptionsApi.getPlans();
const users = await usersApi.getAll();
```

**Оценка:** 1 час

### Этап 4: Reader компонент (1-2 часа)

**Файлы:**
- `src/pages/Reader.tsx`

**После:**
```typescript
import { accessApi, filesApi, sessionsApi, bookmarksApi } from '@/api';

const hasAccess = await accessApi.checkAccess(bookId);

const session = await sessionsApi.start({
  book_id: bookId,
  start_page: 1,
});

await bookmarksApi.create({
  book_id: bookId,
  page: currentPage,
  note: 'My note',
});

await accessApi.updateProgress(accessId, {
  current_page: page,
  progress_percent: (page / totalPages) * 100,
});
```

**Оценка:** 2 часа

### Этап 5: Тестирование (2-3 часа)

1. **Функциональное тестирование**
   - [ ] Login/Register работает
   - [ ] Список книг загружается
   - [ ] Создание/редактирование/удаление книг
   - [ ] Коллекции работают
   - [ ] Reviews & Bookmarks
   - [ ] Reader с прогрессом
   - [ ] Admin функции

2. **Edge cases**
   - [ ] 401 ошибки - редирект на login
   - [ ] 403 ошибки - показывается сообщение
   - [ ] 404 ошибки - обрабатываются
   - [ ] Network errors - retry механизм

3. **Performance**
   - [ ] Loading states работают
   - [ ] Pagination работает
   - [ ] Infinite scroll работает
   - [ ] Debounced search работает

### Этап 6: Очистка (30 минут)

1. **Удалить старый код**
   - [ ] Удалить старый `src/api/client.ts` (если не используется)
   - [ ] Удалить старые типы из `src/types/`
   - [ ] Удалить неиспользуемые импорты

2. **Обновить документацию**
   - [ ] Обновить комментарии
   - [ ] Обновить README если нужно

## 🚀 Быстрый старт миграции

### Шаг 1: Генерация API

```bash
cd frontend
npm run api:generate:local
```

### Шаг 2: Проверка типов

```bash
npx tsc --noEmit
```

Это покажет все места, где типы не совпадают.

### Шаг 3: Миграция по одному модулю

Начните с самого простого модуля (например, Categories):

```typescript
// До
import api from '@/api/client';
const response = await api.get('/categories');
const categories = response.data.data;

// После
import { categoriesApi } from '@/api';
const categories = await categoriesApi.getAll();
```

### Шаг 4: Добавление хуков

```typescript
// До
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } finally {
      setLoading(false);
    }
  };
  fetchCategories();
}, []);

// После
import { categoriesApi, useQuery } from '@/api';

const { data: categories, loading } = useQuery(
  () => categoriesApi.getAll(),
  []
);
```

### Шаг 5: Тестирование

```bash
npm run dev
```

Проверьте что модуль работает, затем переходите к следующему.

## 📊 Progress Tracking

### Модули для миграции

- [ ] Auth (Login, Register, authStore)
- [ ] Books (Books, BookDetail, AdminBooks, Library)
- [ ] Collections
- [ ] Reviews
- [ ] Bookmarks
- [ ] Readers
- [ ] Borrow
- [ ] Categories
- [ ] Groups
- [ ] Subscriptions
- [ ] Users
- [ ] Reader (с Sessions, Access, Bookmarks)
- [ ] Profile (Social API)

### Оценки времени

| Этап | Время | Сложность |
|------|-------|-----------|
| Подготовка | ✅ 0h | - |
| Auth модуль | 0.5h | Низкая |
| Books модуль | 2h | Средняя |
| Collections | 1h | Низкая |
| Reviews & Bookmarks | 0.5h | Низкая |
| Readers & Borrow | 1h | Низкая |
| Categories & Groups | 1h | Низкая |
| Subscriptions & Users | 1h | Низкая |
| Reader компонент | 2h | Высокая |
| Тестирование | 2-3h | Средняя |
| Очистка | 0.5h | Низкая |
| **ИТОГО** | **11-12h** | - |

## 🎯 Приоритеты

### Must-Have (критично для работы)

1. ✅ Auth (login/register)
2. ✅ Books (просмотр списка)
3. ✅ BookDetail (детальная страница)
4. ✅ Reader (чтение книг)

### Should-Have (важно)

5. Collections
6. Reviews & Bookmarks
7. Readers & Borrow

### Nice-to-Have (можно позже)

8. Categories
9. Groups
10. Subscriptions
11. Admin функции

## 🔧 Полезные команды

```bash
# Регенерация API
npm run api:generate:local

# Проверка типов
npx tsc --noEmit

# Поиск использования старого API
grep -r "api.get\|api.post\|api.put\|api.delete" src/

# Поиск импортов старого API
grep -r "from '@/api/client'" src/

# Dev сервер
npm run dev

# Build
npm run build
```

## 📝 Чеклист перед завершением

- [ ] Все компоненты используют новый API wrapper
- [ ] Все типы импортируются из `@/api`
- [ ] Нет прямых вызовов `api.get/post/put/delete`
- [ ] `npx tsc --noEmit` проходит без ошибок
- [ ] `npm run build` успешно завершается
- [ ] Все основные функции протестированы
- [ ] Документация обновлена
- [ ] Старый код удален

## 🎉 После завершения

1. **Коммит изменений**
   ```bash
   git add .
   git commit -m "feat: migrate to auto-generated API client"
   git push
   ```

2. **Создание PR**
   - Описать изменения
   - Добавить скриншоты
   - Запросить review

3. **Deploy**
   - Merge в main
   - Автоматический deploy через CI/CD

## 📚 Дополнительные ресурсы

- [API_GUIDE.md](./frontend/API_GUIDE.md) - Полное руководство
- [README.md](./frontend/README.md) - Быстрый старт
- [ApiExamples.tsx](./frontend/src/examples/ApiExamples.tsx) - Примеры

## 🆘 Помощь

Если возникли проблемы:

1. Проверьте [API_GUIDE.md](./frontend/API_GUIDE.md) - раздел Troubleshooting
2. Проверьте примеры в `src/examples/ApiExamples.tsx`
3. Запустите `npm run api:generate:local` для обновления типов
4. Проверьте console для ошибок API
