# System Architecture

> **afst** — Library Management System  
> Last updated: March 2026

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│                    React 18 + TypeScript + Vite                 │
│              (SPA served from GitHub Pages / CDN)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / REST + SSE
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Go API Server                              │
│                  Gin · GORM · JWT · SSE                         │
│                   Hosted on Render.com                          │
│                                                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Auth    │  │  Books    │  │ Borrow   │  │ Subscriptions│  │
│  │ /register│  │  /books   │  │ /borrow  │  │ /subscriptions│ │
│  │ /login   │  │ /files    │  │          │  │              │  │
│  └──────────┘  └───────────┘  └──────────┘  └──────────────┘  │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Readers  │  │ Reviews   │  │ Social   │  │  SSE Stream  │  │
│  │ /readers │  │ /reviews  │  │ /profile │  │ /events/     │  │
│  └──────────┘  └───────────┘  └──────────┘  └──────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
┌───────────────────┐          ┌──────────────────┐
│   SQLite DB       │          │   File Storage   │
│   (GORM + soft    │          │   (local disk /  │
│    delete)        │          │   Render disk)   │
└───────────────────┘          └──────────────────┘
```

---

## Frontend Architecture

```
frontend/src/
├── api/                    # API client layer
│   ├── client.ts           # Axios instance + interceptors
│   ├── wrapper.ts          # Typed API call wrappers
│   └── adapter.ts          # Response normalisation
│
├── components/
│   ├── ui/                 # Atomic UI: Button, Input, Modal…
│   ├── layout/             # Navbar, Layout wrapper
│   ├── books/              # Book-specific components
│   └── reviews/            # Review components
│
├── hooks/                  # Reusable React hooks
│   ├── useForm.ts          # Form state machine
│   ├── useSSE.ts           # Server-Sent Events subscription
│   └── useEvents.ts        # EventBus subscriptions
│
├── lib/
│   ├── stateMachine.ts     # Generic finite state machine (useMachine)
│   ├── eventBus.ts         # In-memory pub/sub (cross-component)
│   └── swagger-parser.ts   # OpenAPI schema parsing
│
├── pages/                  # Route-level page components
│   ├── Reader.tsx          # PDF + EPUB reader (pdfjs + epubjs)
│   ├── Books.tsx           # Book catalog with search
│   ├── Dashboard.tsx       # Admin stats overview
│   └── …                   # Login, Register, Profile, etc.
│
├── store/
│   ├── authStore.ts        # Zustand: JWT token + user info
│   └── apiConfigStore.ts   # Zustand: API endpoint config
│
└── shared/api/             # Auto-generated OpenAPI client
    ├── models/             # TypeScript interfaces from swagger
    └── services/           # Generated service classes
```

### State Management Strategy

| Layer | Tool | What it manages |
|-------|------|-----------------|
| Server state | Direct API calls | Books, users, borrow records |
| Auth state | Zustand (`authStore`) | JWT token, user identity |
| UI config | Zustand (`apiConfigStore`) | API URL, connection status |
| Form state | Custom `useForm` hook + state machine | Input values, validation, submit state |
| Real-time | SSE + `eventBus` | Live notifications, book events |

---

## Backend Architecture

```
cmd/server/main.go          # Entry point, wires up everything
│
├── internal/config/        # Env-based configuration
├── internal/auth/          # JWT issuance & bcrypt hashing
├── internal/middleware/    # auth.go (JWT check), logging.go
│
├── internal/handlers/      # HTTP layer (Gin)
│   ├── router.go           # Route registration
│   ├── book_handler.go     # GET/POST/PUT/DELETE /books
│   ├── borrow_handler.go   # POST /borrow, POST /borrow/return
│   ├── sse_handler.go      # GET /events/stream
│   └── …                   # auth, readers, files, reviews, social
│
├── internal/models/        # GORM models + DTOs
│   ├── book.go             # Book, BookFile, BookAccess
│   ├── borrowed_book.go    # BorrowedBook
│   ├── reading_features.go # Bookmark, ReadingSession, Review
│   └── dto.go              # Request/response structs
│
├── internal/events/        # In-process event bus + NATS bridge
│   ├── bus.go              # EventBus (fanout to SSE clients)
│   └── nats_bridge.go      # NATS subscriber (optional)
│
└── migrations/             # SQL migrations (PostgreSQL-compatible)
    ├── 001_initial_tables.up.sql
    └── 002_add_book_description.up.sql
```

### Request Lifecycle

```
Client Request
    │
    ▼
Gin Router  ──► 404 if no route match
    │
    ▼
Auth Middleware  ──► 401 if token missing/invalid (protected routes)
    │
    ▼
Handler Function
    │
    ├─► Validate input (binding + manual rules)
    │       └─► 400 Bad Request on validation failure
    │
    ├─► Business logic (direct DB calls via GORM)
    │       └─► 422/409/404 on business rule violations
    │
    ├─► Persist to SQLite
    │
    ├─► Emit event to EventBus (async, for SSE)
    │
    └─► JSON response (200/201/204)
```

---

## Real-Time Events (SSE)

```
Client connects to GET /events/stream?token=<jwt>
    │
    ▼
SSE Handler registers a channel in EventBus
    │
    ▼
Any handler can call:  bus.Publish(EventType, payload)
    │
    ▼
EventBus fans out to all subscribed SSE channels
    │
    ▼
Client receives:  event: book.uploaded\ndata: {...}\n\n
```

**Event types:** `connected`, `ping`, `book.uploaded`, `book.processed`,  
`access.granted`, `access.revoked`, `subscription.new`, `subscription.expired`, `reading.progress`

---

## Database Schema (simplified)

```
users           books           readers         borrowed_books
──────          ──────          ───────         ──────────────
id (UUID)       id (UUID)       id (UUID)       id (UUID)
email           title           name            book_id → books
password_hash   author          email           reader_id → readers
created_at      publication_yr  created_at      borrow_date
deleted_at      isbn            deleted_at      return_date (null = active)
                copies_count                    deleted_at
                description
                is_premium

book_files      bookmarks       reading_sessions    reviews
──────────      ─────────       ────────────────    ───────
id              id              id                  id
book_id         book_id         access_id           book_id
file_name       reader_id       start_time          user_id
mime_type       location        end_time            rating (1-5)
file_size       label           pages_read          body
page_count                      total_pages         created_at
```

---

## Security Model

| Concern | Approach |
|---------|----------|
| Authentication | JWT (HS256, 24h expiry) — Bearer token in `Authorization` header |
| Password storage | bcrypt (cost 10) |
| SSE authentication | JWT passed as `?token=` query param (EventSource limitation) |
| Public endpoints | `GET /books`, `GET /books/:id`, `GET /health` — no auth required |
| Admin endpoints | `POST /setup` — first-run only, disabled after first admin created |
| CORS | Configured per environment in `config.go` |
| SQL injection | Prevented by GORM parameterized queries |
| File access | Gated by `book_access` check before serving file bytes |

---

## Deployment

```
GitHub (main branch)
    │ push
    ▼
GitHub Actions CI
    ├── Frontend: lint → typecheck → build → upload dist
    └── Backend:  lint → test → build → vulncheck
    │
    │ (on success, Render auto-deploys)
    ▼
Render.com Web Service
    ├── Build:  go build -o main ./cmd/server
    └── Start:  ./main
    │
    ├── Persistent Disk: /var/data/library.db  (SQLite)
    └── Env vars:  PORT, JWT_SECRET, DB_SQLITE_PATH, GIN_MODE=release

Frontend → GitHub Pages (separate deploy workflow)
```
