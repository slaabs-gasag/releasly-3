# Research: Internal Release Management Dashboard

**Branch**: `001-release-management` | **Date**: 2026-05-20 (amended 2026-05-20)

## User Authentication

**Decision**: Azure Entra ID (formerly Azure AD) as the identity provider via OIDC.
Frontend: NextAuth.js v5 with the `azure-ad` provider. Backend: validates JWT access
token from the session on protected API calls.

**Dev Login**: A bypass button rendered only when `NODE_ENV=development` (or
`NEXT_PUBLIC_DEV_AUTH=true`). Clicking it creates a local session with a hardcoded
dev user identity without contacting the identity provider. This button is compiled
out or hidden in production builds.

**Session**: NextAuth.js server-side sessions (JWT or database adapter). Session cookie
is httpOnly; not accessible to JavaScript. Session duration: 8 hours idle timeout.

**Backend protection**: FastAPI validates the session/token forwarded by Next.js API
routes. Unauthenticated requests receive `401 Unauthorized`.

**Required env vars** (production):
```
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000  (or production URL)
```

**Alternatives considered**: Custom JWT auth — more complex, reinvents the wheel;
Keycloak — not available internally; no auth — rejected by user requirement.

---

## Architecture Decision

**Decision**: Python FastAPI backend + Next.js 14 frontend + PostgreSQL database.

**Rationale**: User explicitly specified both. FastAPI handles async HTTP integration
work (YouTrack + Azure DevOps APIs) and PostgreSQL persistence. Next.js provides
SSR and a rich component ecosystem for charts and UI. PostgreSQL handles project
definitions and the release cache.

**Alternatives considered**: Monolithic Python server with Jinja2 — rejected (worse
UI); SQLite — rejected (file-locking under concurrent requests; PostgreSQL gives proper
concurrent access and is production-standard).

---

## Credential Storage Decision

**Decision**: Per-user credentials stored in browser **localStorage**. Backend receives
credentials as request headers per-request and never persists them.

**Rationale**: Each user has their own YouTrack bearer token and Azure DevOps PAT. A
shared .env token would not work in a multi-user internal tool. localStorage is
acceptable for an internal tool on a trusted network.

**Credential headers**:
- `X-YouTrack-Token`: bearer token
- `X-YouTrack-Url`: YouTrack base URL
- `X-AzureDevOps-Pat`: PAT
- `X-AzureDevOps-Url`: Azure DevOps org URL

**Alternatives considered**: Server-side session storage — adds auth complexity; OAuth
flows per user — too complex for an internal tool; shared .env tokens — not suitable
for multi-user where each person uses their own personal token.

---

## YouTrack Integration

**Decision**: REST API v3 via `httpx` async client; token from request header.

**Key endpoints**:
- Projects: `GET /api/admin/projects`
- Versions: `GET /api/admin/projects/{projectId}/versions`
- Version details: `GET /api/admin/projects/{projectId}/versions/{id}`

**Authentication**: Bearer token from `X-YouTrack-Token` header; base URL from
`X-YouTrack-Url` header. Backend uses these per-request only.

---

## Azure DevOps Integration

**Decision**: Azure DevOps REST API 7.1 via `httpx` async client; PAT from request
header.

**Key endpoints**:
- Releases: `GET /{org}/{project}/_apis/release/releases?api-version=7.1`
- Release details: `GET /{org}/{project}/_apis/release/releases/{id}`
- Git tags: `GET /{org}/{project}/_apis/git/repositories/{repo}/refs?filter=tags`

**Authentication**: Basic auth with PAT as password; org URL from `X-AzureDevOps-Url`,
PAT from `X-AzureDevOps-Pat` header.

---

## Database

**Decision**: PostgreSQL. Connection string from `DATABASE_URL` in `.env`. ORM: SQLAlchemy
2.x with async support (`asyncpg` driver). Migrations: Alembic.

**Tables**: `projects`, `cached_releases` (see data-model.md).

**Rationale**: PostgreSQL is production-standard, handles concurrent access, and is
widely available internally. `.env` holds only the connection string — no other secrets
server-side.

---

## Caching Strategy

**Decision**: PostgreSQL-backed cache (`cached_releases` table). Background refresh task
(FastAPI lifespan) refetches release data every 5 minutes per project.

**Credential challenge**: Background refresh needs user credentials but they live in
localStorage. Resolution: Background refresh only updates cache from the **last
successful user-triggered fetch**. If no user has fetched within the TTL window, the
cache is served as-is with the `data_stale` flag.

**Rationale**: Avoids storing credentials server-side while still providing staleness
fallback. A user's first visit populates the cache; subsequent visits (or other users)
can see stale data with an indicator.

---

## Frontend Charting Library

**Decision**: Recharts — React-native, TypeScript, composable API.

**Alternatives considered**: Chart.js (extra React wrapper needed); Tremor (opinionated
design may conflict with design reference).

---

## Frontend Credential Management

**Decision**: Custom React context (`UserSettingsContext`) wraps localStorage access.
Credentials exposed to API service layer via context; never stored in React state or
server memory.

**First-time setup**: `CredentialSetupScreen` shown when `releasly_user_settings`
localStorage key is missing or incomplete.

---

## Design Reference

**User-provided**: `https://api.anthropic.com/v1/design/h/7VqLxsF5VxbokVMqVnUqcA`

Consult during frontend implementation for visual styling decisions. The UI MUST follow
the design system defined in that reference.

---

## Release Naming Conventions

**semver**: `MAJOR.MINOR.PATCH` — regex `^\d+\.\d+\.\d+$`
**date**: `YYYYMMDD.[sequence]` — regex `^\d{8}\.\d+$`
When neither matches: displayed as-is with ⚠ indicator.

---

## Testing Strategy

**Backend**: pytest + httpx async test client + respx (mock YouTrack/Azure DevOps
HTTP). Database tests use a test PostgreSQL instance (testcontainers or a dedicated
test DB). All integration tests written before implementation (TDD per constitution).

**Frontend**: Jest + React Testing Library for components. Playwright for E2E: covers
credential setup flow, portfolio load, release detail, and project management.
