# Contributing to afst

> **Library API** — Go REST API + React frontend for library management.  
> We use **trunk-based development** with short-lived feature branches and CI gates on every PR.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Process](#development-process)
- [Getting Started](#getting-started)
- [Branching Strategy](#branching-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Sprint & Issue Workflow](#sprint--issue-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Release Process](#release-process)

---

## Code of Conduct

Be respectful. No harassment, discrimination, or hostility.  
Issues and PRs are technical spaces — keep feedback constructive and specific.

---

## Development Process

We follow a lightweight **Agile / Scrum-inspired** process:

| Ceremony | Cadence | Purpose |
|----------|---------|---------|
| Sprint Planning | Every 2 weeks | Pick issues from backlog into sprint |
| Daily standup | Async (PR comments) | Share progress, blockers |
| Sprint Review | End of sprint | Demo what shipped |
| Retrospective | End of sprint | What to improve in process |

**Sprint length:** 2 weeks  
**Sprint board:** GitHub Projects (Kanban columns: `Backlog → Todo → In Progress → Review → Done`)

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Go | 1.24+ |
| Node.js | 20+ |
| Docker | 24+ |
| Make | any |

### Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/oneErrortime/afst.git
cd afst

# 2. Copy environment config
cp .env.example .env
# Edit .env with your local values

# 3. Start the backend
go run ./cmd/server

# 4. Start the frontend (new terminal)
cd frontend
npm ci
npm run dev
```

The API will be at `http://localhost:8080` and UI at `http://localhost:5173`.

---

## Branching Strategy

We use **trunk-based development**. All branches are short-lived and merge into `main`.

```
main
├── feat/reader-search           ← new feature
├── fix/epub-page-count          ← bug fix
├── chore/update-gin-v1.10       ← dependency / maintenance
└── docs/api-endpoints           ← documentation only
```

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<short-description>` | `feat/book-search` |
| Bug fix | `fix/<short-description>` | `fix/jwt-refresh` |
| Chore | `chore/<short-description>` | `chore/deps-update` |
| Docs | `docs/<short-description>` | `docs/api-reference` |
| Hotfix | `hotfix/<short-description>` | `hotfix/null-pointer-crash` |

Rules:
- Branch from `main`, merge back to `main`
- Keep branches alive ≤ 3 days (to avoid merge conflicts)
- Delete branch after PR is merged

---

## Commit Convention

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(<scope>): <short description>

[optional body]

[optional footer: Closes #<issue>]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Dependency update, tooling, CI |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `perf` | Performance improvement |
| `style` | Formatting, no logic change |
| `ci` | CI/CD configuration |

### Scopes

`frontend`, `backend`, `auth`, `books`, `reader`, `ci`, `db`, `docker`, `docs`

### Examples

```bash
feat(reader): add PDF page thumbnail preview
fix(auth): handle expired JWT gracefully with 401 response
chore(deps): update react to 18.3.1
test(books): add unit tests for borrow service
ci: split frontend lint and build into separate jobs
```

---

## Pull Request Process

### Before Opening a PR

- [ ] Branch is up-to-date with `main`
- [ ] All CI checks pass locally (`npm run lint`, `go test ./...`)
- [ ] PR is scoped to **one concern** (one bug, one feature)
- [ ] PR title follows commit convention: `type(scope): description`

### PR Size Guidelines

| Size | Lines changed | Guideline |
|------|--------------|-----------|
| 🟢 Small | < 200 | Ideal — easy to review |
| 🟡 Medium | 200–500 | Acceptable — add context in description |
| 🔴 Large | > 500 | Break it down if possible |

### Review Process

1. Open PR → CI runs automatically
2. At least **1 approval** required before merge
3. Reviewer leaves comments → author addresses → re-requests review
4. All conversations must be **resolved** before merge
5. Merge strategy: **Squash and merge** (keeps `main` history clean)

---

## Sprint & Issue Workflow

### Issue Lifecycle

```
needs-triage → [reviewed] → Todo → In Progress → Review → Done
```

1. **New issue created** — labeled `needs-triage`
2. **Team reviews** — adds priority + area labels, assigns to sprint
3. **Developer picks up** — moves to `In Progress`, assigns self
4. **PR opened** — issue linked in PR description (`Closes #N`)
5. **PR merged** — issue auto-closes, moves to `Done`

### Labels we use

| Category | Labels |
|----------|--------|
| **Type** | `bug`, `enhancement`, `chore`, `documentation`, `security` |
| **Area** | `area: frontend`, `area: backend`, `area: ci-cd`, `area: auth` |
| **Priority** | `priority: critical`, `priority: high`, `priority: medium`, `priority: low` |
| **Status** | `needs-triage`, `in progress`, `blocked`, `ready for review` |

### Milestones = Sprints

Each 2-week sprint has a milestone:
- `v0.2 — Quality Sprint` (due: TBD)
- `v0.3 — UX Sprint` (due: TBD)
- `v1.0 — Production Ready` (due: TBD)

---

## Code Style

### Go

- Follow [Effective Go](https://go.dev/doc/effective_go) and [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- Run `gofmt` before committing (enforced by CI)
- Error messages: lowercase, no punctuation at end
- Handler functions: use `c.JSON(status, gin.H{"error": "message"})`
- No global state; pass dependencies via struct fields

### TypeScript / React

- ESLint + React Compiler rules enforced by CI
- Prefer `function` keyword for components (not arrow functions)
- Hooks: custom hooks in `src/hooks/`, pure utils in `src/lib/`
- No `any` unless absolutely necessary and documented
- No `console.log` in committed code

---

## Testing

### Backend (Go)

```bash
# Run all tests
go test ./...

# With race detector and coverage
go test ./... -race -coverprofile=coverage.out

# Single package
go test ./internal/handlers/... -v
```

Target coverage: **≥ 70%** for `internal/services/` and `internal/handlers/`

### Frontend

```bash
cd frontend
npm run lint        # ESLint
npx tsc --noEmit    # Type check
npm run build       # Build (catches bundler errors)
```

> End-to-end tests (Playwright) are planned for Sprint 3.

---

## Release Process

We use **semantic versioning**: `MAJOR.MINOR.PATCH`

| Bump | When |
|------|------|
| `PATCH` | Bug fixes only |
| `MINOR` | New features, backwards-compatible |
| `MAJOR` | Breaking API changes |

### Cutting a Release

1. Create a PR: `chore: bump version to vX.Y.Z`
   - Update version in `frontend/package.json`
   - Update `CHANGELOG.md`
2. Merge to `main`
3. Create GitHub Release + tag `vX.Y.Z`
4. CI deploys automatically to production

---

## Questions?

Open a [Discussion](https://github.com/oneErrortime/afst/discussions) or ping in a PR comment.
