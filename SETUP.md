# Quick Setup Guide

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Generate API client from swagger.json
npm run api:generate:local

# Start dev server
npm run dev
```

Access at: http://localhost:5173/afst/

## Auto-Generated UI

The frontend automatically generates UI for all API endpoints:

1. **Auto API Client** - Generated from `docs/swagger.json`
2. **Auto UI** - Forms, tables, and CRUD operations
3. **Zero manual work** - Just run `npm run api:generate:local`

### When you add a new API endpoint:

**Backend:**
```bash
# Add your endpoint in Go
swag init  # Regenerate swagger.json
```

**Frontend:**
```bash
cd frontend
npm run api:generate:local  # Regenerate API client
```

Your new endpoint automatically appears in:
- API client (`src/shared/api/`)
- Auto-generated UI (`/auto` route)
- Type-safe TypeScript wrappers

## Available Scripts

```bash
npm run api:generate:local    # Generate from docs/swagger.json
npm run api:generate          # Generate from dev server
npm run api:generate:prod     # Generate from production
npm run dev                   # Start dev server
npm run build                 # Production build
npm run lint                  # ESLint check
```

## Features

✅ Auto-generated API client from OpenAPI
✅ Auto-generated UI (forms, tables, CRUD)
✅ Type-safe TypeScript throughout
✅ React hooks (useQuery, useMutation, pagination)
✅ Automatic authentication
✅ Error handling
✅ Zero duplicate navigation items

## Documentation

- `frontend/README.md` - Frontend overview
- `frontend/API_GUIDE.md` - Complete API reference
- `frontend/AUTO_UI.md` - Auto-UI system details
- `FRONTEND_STATUS.md` - Current status
- `MIGRATION.md` - Migration guide

## Test

```bash
bash test-frontend.sh
```

## Access Points

- Main app: http://localhost:5173/afst/
- Auto UI: http://localhost:5173/afst/auto
- Books: http://localhost:5173/afst/books
- Login: http://localhost:5173/afst/login
