# 🗺️ Product Roadmap & Sprint Plan

> **Project:** afst — Library Management System  
> **Stack:** Go 1.24 · Gin · GORM · SQLite · React 18 · TypeScript · Vite  
> **Hosted:** [Render.com](https://afst-4.onrender.com)  
> **Process:** 2-week sprints, trunk-based development, CI on every PR

---

## Current State (as of Sprint 1 close)

| Area | Status | Notes |
|------|--------|-------|
| Go REST API | ✅ Stable | Auth, Books, Readers, Borrow, SSE, Subscriptions |
| React Frontend | ✅ Functional | All pages wired, ESLint clean |
| CI — Frontend | ✅ Running | Lint → TypeCheck → Build |
| CI — Backend | 🔶 Added | Lint → Test → Build → Security |
| Test coverage | 🔴 Low | Only handler unit tests |
| E2E Tests | 🔴 Missing | Planned Sprint 3 |
| Documentation | 🟡 Partial | README ok, API docs via Swagger |
| Deployment | ✅ Working | Render.com (auto-deploy on main push) |

---

## Sprint 1 — Foundation ✅ `CLOSED`
**Goal:** Get CI green, lint clean, repo properly structured.

| # | Task | Type | Status |
|---|------|------|--------|
| 1 | Fix 16 ESLint errors and warnings | chore | ✅ Done |
| 2 | Fix `react-hooks/refs` render-time access | fix | ✅ Done |
| 3 | Split frontend CI into Lint / TypeCheck / Build jobs | ci | ✅ Done |
| 4 | Add backend CI (golangci-lint, go test, govulncheck) | ci | ✅ Done |
| 5 | Add issue templates (bug, feature, chore) | chore | ✅ Done |
| 6 | Add PR template | chore | ✅ Done |
| 7 | Add CODEOWNERS | chore | ✅ Done |
| 8 | Add CONTRIBUTING.md | docs | ✅ Done |
| 9 | Add labels.yml | chore | ✅ Done |

---

## Sprint 2 — Quality 🔶 `IN PROGRESS`
**Goal:** Increase reliability through better testing, error handling, and observability.  
**Target:** ≥ 70% backend test coverage, graceful error states in UI.

| # | Task | Type | Priority | Area |
|---|------|------|----------|------|
| 10 | Add unit tests for `BorrowService` (full coverage) | test | 🔴 High | backend |
| 11 | Add unit tests for `BookService` (CRUD + validation) | test | 🔴 High | backend |
| 12 | Add integration tests for `/auth` endpoints | test | 🔴 High | backend |
| 13 | Add React Error Boundary to all route-level pages | fix | 🟡 Medium | frontend |
| 14 | Add global 404 / 500 error pages | feat | 🟡 Medium | frontend |
| 15 | Add loading skeleton to `BookDetail` page | feat | 🟢 Low | frontend |
| 16 | Add request timeout to all Go handlers (30s) | chore | 🟡 Medium | backend |
| 17 | Add structured logging with `slog` | chore | 🟡 Medium | backend |
| 18 | Coverage badge in README (via shields.io) | docs | 🟢 Low | ci |

---

## Sprint 3 — UX & Features 📅 `PLANNED`
**Goal:** Improve the reading experience, add search, and make the UI production-quality.

| # | Task | Type | Priority | Area |
|---|------|------|----------|------|
| 19 | Full-text book search (title, author, ISBN) | feat | 🔴 High | backend + frontend |
| 20 | Paginated book catalog (infinite scroll or pages) | feat | 🔴 High | frontend |
| 21 | EPUB reader — keyboard shortcuts + progress bar | feat | 🟡 Medium | frontend |
| 22 | PDF reader — thumbnail strip for page navigation | feat | 🟡 Medium | frontend |
| 23 | Mobile-responsive reader toolbar | fix | 🔴 High | frontend |
| 24 | Add book cover upload (image file) | feat | 🟡 Medium | backend + frontend |
| 25 | Borrow history page for authenticated users | feat | 🟡 Medium | frontend |
| 26 | Admin: bulk import books from CSV | feat | 🟢 Low | backend + frontend |
| 27 | Playwright E2E tests (auth flow + borrow flow) | test | 🔴 High | ci |

---

## Sprint 4 — Production Ready 📅 `PLANNED`
**Goal:** Harden for production: Docker, monitoring, security audit, performance.

| # | Task | Type | Priority | Area |
|---|------|------|----------|------|
| 28 | Docker Compose dev environment (hot reload) | chore | 🔴 High | docker |
| 29 | Migrate SQLite → PostgreSQL option (env toggle) | feat | 🟡 Medium | backend |
| 30 | Add rate limiting middleware (per-IP) | feat | 🔴 High | backend |
| 31 | OWASP dependency scan in CI | security | 🔴 High | ci |
| 32 | Add Prometheus metrics endpoint `/metrics` | feat | 🟡 Medium | backend |
| 33 | Add OpenTelemetry tracing | feat | 🟢 Low | backend |
| 34 | Cache book list with Redis (optional) | perf | 🟢 Low | backend |
| 35 | Create `CHANGELOG.md` and tag `v1.0.0` release | docs | 🔴 High | docs |
| 36 | Full API documentation (beyond Swagger auto-gen) | docs | 🟡 Medium | docs |

---

## Backlog (Unscheduled)

- Recommendation engine (collaborative filtering)
- Book rating & review moderation
- Multi-language / i18n support
- PWA / offline reading mode
- SAML / OAuth2 SSO login
- Audit log for admin actions
- Webhook notifications on book events

---

## Definition of Done

A task is **Done** when:
1. ✅ Code is merged to `main`
2. ✅ CI passes (lint + type-check + build + tests)
3. ✅ PR description references the issue (`Closes #N`)
4. ✅ No regressions in existing functionality
5. ✅ Documentation updated (if user-facing change)
