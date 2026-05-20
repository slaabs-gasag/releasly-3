# Implementation Plan: Internal Release Management Dashboard

**Branch**: `001-release-management` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-release-management/spec.md`

## Summary

Build Releasly — an internal release management dashboard that aggregates release data from
YouTrack and Azure DevOps. Architecture: Python FastAPI backend + Next.js 14 frontend +
PostgreSQL. Each user stores their own API credentials (YouTrack bearer token, Azure DevOps
PAT) in browser localStorage; the backend receives them per-request and never persists them.
Project definitions and cached release data are stored in PostgreSQL. Only the PostgreSQL
connection string lives in `.env`.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5 / Node.js 20 (frontend)

**Primary Dependencies**:
- Backend: FastAPI, httpx (async HTTP), pydantic v2, python-dotenv, SQLAlchemy 2.x,
  asyncpg, alembic, uvicorn
- Frontend: Next.js 14, React 18, NextAuth.js v5 (Entra ID OIDC), Recharts, Tailwind CSS

**Storage**: PostgreSQL 15 (`projects` + `cached_releases` tables via SQLAlchemy 2.x async +
asyncpg). Alembic for migrations. No file-based config. `.env` holds only `DATABASE_URL`.

**Testing**:
- Backend: pytest + httpx async client + respx (HTTP mocking)
- Frontend: Jest + React Testing Library + Playwright (E2E)

**Target Platform**: Web application — Linux server (backend) + browser (frontend)

**Project Type**: web-service (FastAPI) + web-app (Next.js)

**Performance Goals**: Dashboard loads in < 3 seconds; background cache refresh every
5 minutes; integration API calls < 2 seconds each.

**Constraints**:
- User authentication via Azure Entra ID (OIDC); dev bypass button in development only
- Read-only integration (no writes to YouTrack or Azure DevOps)
- Integration tokens stored in browser localStorage only; backend never persists them
- `.env` / environment contains `DATABASE_URL` + Entra ID app registration credentials
- < 100 configured projects; no pagination in v1

**Scale/Scope**: Internal tool, ~10–100 apps, handful of users. Single-server deployment.

**Design Reference**: `https://api.anthropic.com/v1/design/h/7VqLxsF5VxbokVMqVnUqcA`
(consult during frontend implementation for visual styling)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Automation-First | ✅ PASS | Dashboard loads automatically; no user action to fetch data |
| II. Zero-Config Defaults | ✅ PASS | CACHE_TTL defaults to 300s; PORT defaults to 8000; works with just .env + apps.yml |
| III. Progressive Disclosure | ✅ PASS | Portfolio overview shows minimal data; detail page shows full history on demand |
| IV. Reliability & Observability | ✅ PASS | Stale cache fallback; structured log per fetch; actionable error messages |
| V. Test-Driven Automation | ✅ PASS | Integration tests required before implementation; respx mocks YouTrack/ADO responses |

No violations. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/001-release-management/
├── plan.md           ← this file
├── spec.md           ← feature specification
├── research.md       ← Phase 0 decisions
├── data-model.md     ← entities and schema
├── quickstart.md     ← setup and validation guide
├── contracts/
│   └── api.md        ← REST API contract
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── main.py                         # FastAPI app, CORS, lifespan, background refresh
│   ├── config.py                       # Load .env, settings model
│   ├── database.py                     # SQLAlchemy async engine + session factory
│   ├── models/
│   │   ├── db.py                       # SQLAlchemy ORM: Project, CachedRelease
│   │   ├── project.py                  # Pydantic: ProjectCreate, ProjectSummary
│   │   └── release.py                  # Pydantic: Release, ReleaseStats
│   ├── services/
│   │   ├── youtrack_service.py         # Async YouTrack REST client (token from header)
│   │   ├── azuredevops_service.py      # Async Azure DevOps REST client (PAT from header)
│   │   └── release_service.py         # Orchestrates fetch → cache → stats
│   └── routers/
│       ├── projects.py                 # CRUD /api/projects
│       ├── releases.py                 # GET /api/projects/{id}/releases
│       └── stats.py                   # GET /api/stats, /api/health
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 001_initial_schema.py      # projects + cached_releases tables
├── tests/
│   ├── integration/
│   │   ├── test_youtrack_service.py   # respx mocks YouTrack API
│   │   ├── test_azuredevops_service.py
│   │   └── test_api_endpoints.py      # httpx TestClient + test DB
│   └── unit/
│       ├── test_release_service.py
│       └── test_naming_convention.py
├── .env.example
└── requirements.txt

frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout, SessionProvider, UserSettingsProvider
│   │   ├── page.tsx                    # Dashboard (US3 + US6: portfolio + charts)
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx           # US1: sign-in screen (Entra ID + dev login)
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts           # NextAuth.js route handler
│   │   ├── setup/
│   │   │   └── page.tsx               # US2: integration credential setup screen
│   │   └── projects/
│   │       ├── [id]/
│   │       │   └── page.tsx           # US3: release history detail
│   │       └── new/
│   │           └── page.tsx           # US4: add project form
│   ├── lib/
│   │   └── auth.ts                    # NextAuth.js config (Entra ID provider + dev provider)
│   ├── middleware.ts                  # Protect all routes; redirect to /auth/signin if no session
│   ├── components/
│   │   ├── SignInButton.tsx            # Entra ID sign-in button
│   │   ├── DevLoginButton.tsx         # Dev-only bypass button (renders only in dev mode)
│   │   ├── ProjectCard.tsx            # Project summary card (version, status badges)
│   │   ├── ProjectGrid.tsx            # Portfolio grid layout
│   │   ├── ReleaseList.tsx            # Chronological release list
│   │   ├── ReleaseNotes.tsx           # Markdown-rendered release notes
│   │   ├── OverdueIndicator.tsx       # Visual overdue flag
│   │   ├── StaleIndicator.tsx         # Cache staleness indicator
│   │   ├── ProjectForm.tsx            # Add/edit project form (US5)
│   │   ├── CredentialSetupForm.tsx    # First-time integration credential entry (US2)
│   │   └── charts/
│   │       ├── ReleaseFrequencyChart.tsx
│   │       └── CadenceComparisonChart.tsx
│   ├── context/
│   │   └── UserSettingsContext.tsx    # localStorage credentials + URLs
│   ├── services/
│   │   └── api.ts                     # Typed fetch wrappers; injects credential headers
│   └── types/
│       └── api.ts                     # TypeScript types from API contract
├── tests/
│   ├── components/
│   │   ├── ProjectCard.test.tsx
│   │   ├── CredentialSetupForm.test.tsx
│   │   └── ProjectForm.test.tsx
│   └── e2e/
│       ├── auth.spec.ts               # US1: sign-in, dev login, session expiry
│       ├── credential-setup.spec.ts   # US2: integration credential setup flow
│       ├── dashboard.spec.ts          # US3: portfolio loads
│       ├── release-history.spec.ts    # US4: detail page
│       ├── project-management.spec.ts # US5: add/edit/delete project
│       └── charts.spec.ts             # US6: charts visible
├── public/
├── next.config.js
├── tailwind.config.ts
└── package.json
```

**Structure Decision**: Web application (Option 2). Backend in `backend/`, frontend in
`frontend/`. Both at repository root. No monorepo tooling needed at this scale.

## Complexity Tracking

> No constitution violations — table not required.
