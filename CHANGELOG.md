# Changelog

All notable changes to this project will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Version scheme: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — Sprint 2: Quality

### Planned
- Unit tests for BorrowService and BookService
- Integration tests for `/auth` endpoints
- React Error Boundary on all route-level pages
- Global 404 / 500 error pages
- Request timeout middleware (30s) for Go handlers
- Structured logging with `slog`

---

## [0.1.1] — 2026-03-08

### Fixed
- **frontend/useForm**: replaced `useRef`-during-render init pattern with
  `useState(() => ...)` lazy initialiser to satisfy `react-hooks/refs` rule
- **frontend/stateMachine**: same fix for `useMachine` initial state
- **frontend/useSSE**: moved `handlersRef.current` and `connectRef.current`
  assignments into `useLayoutEffect` — no more render-time ref mutation errors
- **frontend/Dashboard**: removed unused `useAuthStore` import

---

## [0.1.0] — 2026-03-07

### Added
- Backend CI workflow: `golangci-lint` → `go test -race -cover` → `go build` → `govulncheck`
- Frontend CI refactor: split into separate `lint`, `typecheck`, `build` jobs
- Issue templates: Bug Report, Feature Request, Chore
- PR template with type/scope checklist
- `CODEOWNERS` file
- `CONTRIBUTING.md` with branching strategy, commit convention, sprint process
- `docs/ARCHITECTURE.md` — full system architecture overview
- `docs/ROADMAP.md` — 4-sprint roadmap with backlog
- `labels.yml` — label definitions for the repository

### Fixed
- **frontend/StateIndicator**: removed unused `ArrowRight` import
- **frontend/Books**: removed unused `RefreshCw` import; simplified `catch` clause
- **frontend/Dashboard**: removed unused `user` variable
- **frontend/Home**: removed unused `user` and `loading` variables
- **frontend/Reader**: removed unused `selectedFile` and `sessionId` read bindings
- **frontend/useSSE**: removed stale `eslint-disable` comment; fixed `connect`
  self-reference hoisting via `connectRef`
- **frontend/useEvents**: added `callbackRef` pattern to fix missing dependency
  in `useEvent` hook

---

## [0.0.9] — 2026-03-06 (pre-PM)

### Added
- NATS bridge + worker pool for background book processing
- Server-Sent Events (`/events/stream`) for real-time notifications
- Online book viewer (PDF via `pdfjs-dist`, EPUB via `epubjs`)
- Subscription gate — premium books require active subscription
- Reading progress tracking (`ReadingSession` model)
- Bookmarks API
- Social features: follow/unfollow users, public profiles
- Collections: user-curated book lists
- Reviews & ratings
- Categories & user groups
- Admin dashboard with statistics

### Fixed
- Full overhaul of authentication & routing logic (JWT refresh, redirect loops)
- TypeScript build errors in Categories, Subscriptions, Dashboard pages
- Double navbar bug; removed redundant `Layout` wrappers
- State machine & event bus integration

---

## [0.0.1] — initial commit

### Added
- Go REST API: JWT auth, CRUD for Books / Readers / BorrowedBooks
- React + TypeScript frontend: Books catalog, Login, Register, Borrow pages
- SQLite via GORM with soft delete
- Basic Docker + docker-compose
- Render.com deployment config (`render.yaml`)
- GitHub Actions frontend CI (lint + build)
- Swagger docs via `swaggo`
