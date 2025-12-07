# Frontend Auto-Generation System

## ✅ COMPLETED & TESTED

Frontend автоматически генерирует UI для всех API endpoints из swagger.json.

## Features

### 1. Auto API Client Generation
- Генерируется из `docs/swagger.json`
- Полное покрытие всех endpoints
- Type-safe TypeScript

### 2. Auto UI Generation
- **AutoForm** - формы из OpenAPI схем
- **AutoTable** - таблицы с CRUD
- **ResourceManager** - полный UI для ресурсов
- **AutoDashboard** - explorer всех APIs

### 3. Zero Manual Work
При добавлении нового API endpoint:
1. Backend: добавьте endpoint → `swag init`
2. Frontend: `npm run api:generate:local`
3. UI появляется автоматически в `/auto`

## Quick Start

```bash
cd frontend

# Generate API client
npm run api:generate:local

# Start dev server
npm run dev

# Access
http://localhost:5173/afst/
http://localhost:5173/afst/auto  # Auto-generated UI
```

## Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── wrapper.ts              # All APIs (auto-generated wrap)
│   │   └── adapter.ts              # Config & auth
│   │
│   ├── shared/api/                 # Auto-generated from OpenAPI
│   │   ├── services/               # API services
│   │   └── models/                 # TypeScript types
│   │
│   ├── components/auto/            # Auto-UI components
│   │   ├── AutoForm.tsx            # Form generator
│   │   ├── AutoTable.tsx           # Table generator
│   │   └── ResourceManager.tsx    # CRUD UI
│   │
│   ├── lib/
│   │   └── swagger-parser.ts       # Parse swagger.json
│   │
│   └── pages/
│       ├── AutoDashboard.tsx       # API explorer
│       └── AutoResource.tsx        # Dynamic pages
```

## Commands

```bash
# API Generation
npm run api:generate:local    # From docs/swagger.json (recommended)
npm run api:generate          # From dev server
npm run api:generate:prod     # From production

# Development
npm run dev                   # Dev server
npm run build                 # Production build

# Testing
bash test-frontend.sh         # Run all tests
```

## Navigation

Simplified navbar - no duplicate items:
- **Books** - catalog
- **Library** - user library (auth)
- **Collections** - user collections (auth)
- **Readers** - librarian only
- **Панель** - admin dashboard
- **API** - auto-generated UI (admin only)

## How It Works

### 1. API Client Generation
```typescript
// Automatically generated:
import { booksApi, authApi, collectionsApi } from '@/api';

await booksApi.getAll();
await authApi.login(email, password);
```

### 2. Auto UI
Navigate to `/auto` → see all resources
Click any resource → get CRUD UI automatically

### 3. Adding New Endpoint

**Backend:**
```go
// Add new endpoint
// @Summary Get something
// @Router /something [get]
func GetSomething(c *gin.Context) { ... }
```

```bash
swag init
```

**Frontend:**
```bash
npm run api:generate:local
```

New endpoint appears in:
- `src/shared/api/` (types & services)
- `/auto` dashboard (UI)
- Navigation (if configured)

## API Wrapper

All APIs wrapped with:
- Auth auto-injection
- Error handling
- Type safety

```typescript
import { booksApi, useQuery } from '@/api';

function Books() {
  const { data, loading, error } = useQuery(
    () => booksApi.getAll({ limit: 20 }),
    []
  );
  
  return ...
}
```

## Docs

- `API_GUIDE.md` - Full API reference
- `AUTO_UI.md` - Auto-UI system
- `MIGRATION.md` - Migration plan
- `README.md` - Quick start

## Tests

```bash
bash test-frontend.sh
```

Output:
```
✓ swagger-parser
✓ AutoForm
✓ AutoDashboard
✓ API wrapper
✓ Server running
✅ Frontend ready
```

## Commits

```
3012d99 docs: add auto-UI system documentation
5eb789f feat: add auto-generated UI system with full API coverage
7452f04 feat: setup automatic API client generation with full backend coverage
```

Branch: `capy/cap-1-3d46f176`

## Status: ✅ READY

Frontend запущен, протестирован, работает:
- Auto-generation: ✓
- Type-safety: ✓
- CRUD UI: ✓
- Navigation fixed: ✓ (no duplicates)
- Server running: ✓
