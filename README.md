<div align="center">

# 📚 afst — Library Management System

**Full-stack library platform** — Go REST API + React frontend  
with JWT auth, real-time SSE, PDF/EPUB reader, and subscription gating.

[![Frontend CI](https://github.com/oneErrortime/afst/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/oneErrortime/afst/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/oneErrortime/afst/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/oneErrortime/afst/actions/workflows/backend-ci.yml)
[![Go Version](https://img.shields.io/badge/Go-1.24-00add8?logo=go)](https://golang.org)
[![Node Version](https://img.shields.io/badge/Node-20-339933?logo=nodedotjs)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[**Live Demo →**](https://afst-4.onrender.com) · [**API Docs →**](https://afst-4.onrender.com/swagger/index.html) · [**Roadmap →**](docs/ROADMAP.md)

</div>

---

## ✨ Features

| Domain | Capabilities |
|--------|-------------|
| 📖 **Books** | CRUD, file upload (PDF/EPUB), cover images, categories |
| 👤 **Auth** | JWT registration/login, bcrypt passwords, role-based access |
| 🔄 **Borrowing** | Issue/return with business rules (≤3 books per reader, copy tracking) |
| 📡 **Real-time** | Server-Sent Events — live notifications for book events |
| 📄 **Reader** | In-browser PDF (`pdfjs`) + EPUB (`epubjs`), bookmarks, reading progress |
| 💳 **Subscriptions** | Subscription plans, premium content gating |
| 🌐 **Social** | Follow/unfollow, public profiles, collections, reviews & ratings |
| ⚙️ **Admin** | Dashboard stats, user management, group management |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Go 1.24 · Gin · GORM · SQLite (pure-Go) |
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS · Zustand |
| **Auth** | JWT (golang-jwt/v4) · bcrypt |
| **Real-time** | Server-Sent Events · NATS (optional) |
| **CI/CD** | GitHub Actions · Render.com |
| **Testing** | Go `testing` + `testify` · golangci-lint |

---

## 🚀 Quick Start

### Prerequisites
- **Go** 1.24+
- **Node.js** 20+
- **Make** (optional)

### Run locally

```bash
# Clone
git clone https://github.com/oneErrortime/afst.git && cd afst

# Backend
cp .env.example .env
go run ./cmd/server
# → http://localhost:8080

# Frontend (new terminal)
cd frontend && npm ci && npm run dev
# → http://localhost:5173
```

### Docker Compose

```bash
docker-compose up --build
# API → http://localhost:8080
```

### Environment Variables

```env
PORT=8080
GIN_MODE=debug
DB_SQLITE_PATH=library.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

---

## 📡 API Reference

**Base URL:** `https://afst-4.onrender.com/api/v1`  
**Interactive docs:** `/swagger/index.html`

### Public Endpoints

```
GET    /health                      Service health check
POST   /api/v1/auth/register        Register a new librarian
POST   /api/v1/auth/login           Login, receive JWT
GET    /api/v1/books                List books (paginated)
GET    /api/v1/books/:id            Get book details
```

### Protected Endpoints (require `Authorization: Bearer <token>`)

```
POST   /api/v1/books                Create book
PUT    /api/v1/books/:id            Update book
DELETE /api/v1/books/:id            Delete book
POST   /api/v1/books/:id/files      Upload PDF/EPUB file

POST   /api/v1/borrow               Issue book to reader
POST   /api/v1/borrow/return        Return book

GET    /api/v1/readers              List readers
POST   /api/v1/readers              Create reader

GET    /api/v1/events/stream        SSE real-time stream
```

---

## 🗂️ Project Structure

```
afst/
├── cmd/server/          Go entrypoint
├── internal/
│   ├── auth/            JWT + bcrypt
│   ├── handlers/        HTTP handlers (Gin)
│   ├── middleware/       Auth + logging
│   ├── models/          GORM models + DTOs
│   └── events/          EventBus + NATS bridge
├── migrations/          SQL migration files
├── frontend/
│   └── src/
│       ├── api/         Axios client + typed wrappers
│       ├── components/  UI atoms + layout
│       ├── hooks/       useForm, useSSE, useEvents
│       ├── lib/         State machine, EventBus
│       ├── pages/       Route-level components
│       └── store/       Zustand stores
├── docs/
│   ├── ARCHITECTURE.md  System design overview
│   └── ROADMAP.md       Sprint plan + backlog
├── CONTRIBUTING.md      How to contribute
└── CHANGELOG.md         Version history
```

---

## 🗺️ Roadmap

| Sprint | Goal | Status |
|--------|------|--------|
| **v0.1** | Foundation — CI green, repo structured | ✅ Done |
| **v0.2** | Quality — test coverage ≥70%, error handling | 🔶 In Progress |
| **v0.3** | UX — search, pagination, mobile reader | 📅 Planned |
| **v1.0** | Production — Docker, monitoring, PostgreSQL option | 📅 Planned |

→ Full details in [**docs/ROADMAP.md**](docs/ROADMAP.md)

---

## 🤝 Contributing

Please read [**CONTRIBUTING.md**](CONTRIBUTING.md) before opening a PR.

**Quick summary:**
- Branch from `main` → `feat/<name>` or `fix/<name>`
- Commit convention: `type(scope): description` ([Conventional Commits](https://www.conventionalcommits.org/))
- All CI checks must pass before merge
- Squash-merge only

---

## 📄 License

[MIT](LICENSE) — © 2026 oneErrortime
