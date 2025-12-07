# Auto-Generated UI System

## What it does

Automatically creates UI for ALL your API endpoints from `swagger.json`:
- **AutoForm** - generates forms from OpenAPI schemas
- **AutoTable** - generates tables with sorting/filtering
- **ResourceManager** - complete CRUD UI for any resource
- **AutoDashboard** - explorer showing all available APIs

## How it works

1. **Parses swagger.json** at build time
2. **Extracts** all endpoints, schemas, and field types
3. **Generates** forms, tables, and pages automatically
4. **Updates** when you change your API (just re-run `npm run api:generate:local`)

## Usage

### View all APIs
```
http://localhost:5173/afst/auto
```

### Auto-manage any resource
```
http://localhost:5173/afst/auto/books
http://localhost:5173/afst/auto/users
http://localhost:5173/afst/auto/collections
```

### Add new endpoint to backend
1. Add endpoint in Go backend
2. Run `swag init` in backend
3. Run `npm run api:generate:local` in frontend
4. New endpoint appears automatically in `/auto` dashboard

## Files

- `src/lib/swagger-parser.ts` - Parse swagger.json
- `src/components/auto/AutoForm.tsx` - Form generator
- `src/components/auto/AutoTable.tsx` - Table generator
- `src/components/auto/ResourceManager.tsx` - Complete CRUD UI
- `src/pages/AutoDashboard.tsx` - API explorer
- `src/pages/AutoResource.tsx` - Dynamic resource pages

## Integration

Auto-UI is linked in Navbar (Admin only) → "API" button

## Commands

```bash
# Generate API client from swagger
npm run api:generate:local

# Dev server
npm run dev

# Build
npm run build
```

## Features

✅ Automatic form generation from OpenAPI schemas
✅ Type inference (text, number, email, date, select, checkbox)
✅ CRUD operations without writing UI code
✅ Pagination and filtering
✅ Real-time updates when API changes
✅ Type-safe with full TypeScript support
