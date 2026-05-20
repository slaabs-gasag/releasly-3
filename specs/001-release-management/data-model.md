# Data Model: Internal Release Management Dashboard

**Branch**: `001-release-management` | **Date**: 2026-05-20 (amended 2026-05-20)

## Storage Layers

| Layer | What | Where |
|-------|------|--------|
| User credentials + URLs | YouTrack bearer token, YouTrack base URL, Azure DevOps PAT, Azure DevOps org URL | Browser localStorage (per user, never server-side) |
| Project configuration | App definitions, naming conventions, cycle targets | PostgreSQL |
| Cached release data | Last-known releases per project | PostgreSQL |
| Live release data | Current release history fetched on demand | Integration sources (YouTrack / Azure DevOps) |

---

## Browser-Local: UserSettings

Stored in `localStorage` key `releasly_user_settings`. Never transmitted to or persisted by the server.

| Field | Type | Description |
|-------|------|-------------|
| `youtrack_base_url` | string | e.g., `https://youtrack.example.com` |
| `youtrack_token` | string | Bearer token for YouTrack REST API |
| `azuredevops_org_url` | string | e.g., `https://dev.azure.com/my-org` |
| `azuredevops_pat` | string | Personal Access Token for Azure DevOps |

**Validation rules**:
- URLs MUST be valid HTTPS URLs.
- Tokens MUST be non-empty strings.
- Settings are considered "configured" only when all fields for at least one source are
  present and non-empty.

---

## PostgreSQL: Project

Represents a configured internal application tracked by Releasly.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Internal identifier |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | URL-safe identifier (e.g., `my-app`) |
| `name` | VARCHAR(255) | NOT NULL | Human-readable display name |
| `source` | ENUM | NOT NULL, `youtrack` \| `azuredevops` | Integration source type |
| `youtrack_project_id` | VARCHAR(255) | nullable | YouTrack project short name or ID |
| `azuredevops_project` | VARCHAR(255) | nullable | Azure DevOps project name |
| `azuredevops_repository` | VARCHAR(255) | nullable | Azure DevOps repository slug |
| `naming_convention` | ENUM | NOT NULL, `semver` \| `date` | Release version naming scheme |
| `release_cycle_days` | INTEGER | NOT NULL, CHECK > 0 | Expected days between releases |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Last update timestamp |

**Constraints**:
- If `source = youtrack`: `youtrack_project_id` MUST NOT be null.
- If `source = azuredevops`: `azuredevops_project` and `azuredevops_repository` MUST
  NOT be null.
- `slug` MUST match `^[a-z0-9-]+$`.

---

## PostgreSQL: CachedRelease

Stores the last-known release data for each project. Used when the integration source
is unreachable.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Internal identifier |
| `project_id` | UUID | FK → Project.id, NOT NULL | Parent project |
| `version` | VARCHAR(255) | NOT NULL | Version string from integration source |
| `release_date` | TIMESTAMPTZ | NOT NULL | UTC release timestamp |
| `release_notes` | TEXT | nullable | Markdown release notes |
| `naming_convention` | ENUM | NOT NULL | `semver`, `date`, or `unknown` |
| `is_convention_match` | BOOLEAN | NOT NULL | True if version matches project convention |
| `fetched_at` | TIMESTAMPTZ | NOT NULL | When this cache entry was written |

**Indexes**:
- `(project_id, release_date DESC)` — used to retrieve latest release per project
- `(project_id, version)` — unique constraint for deduplication

---

## View Model: ProjectSummary

Returned by the portfolio API endpoint. Combines Project + latest CachedRelease.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Project.id |
| `slug` | string | Project.slug |
| `name` | string | Project.name |
| `source` | string | Integration source label |
| `current_version` | string \| null | Latest release version, null if no data yet |
| `last_release_date` | datetime \| null | UTC of latest release |
| `is_overdue` | boolean | True if days since release > release_cycle_days × 1.1 |
| `days_since_release` | int \| null | Days elapsed since latest release |
| `release_cycle_days` | int | Configured cadence |
| `data_stale` | boolean | True if `fetched_at` > 10 minutes ago |
| `data_fetched_at` | datetime \| null | Timestamp of last successful fetch |

---

## View Model: ReleaseStats

Aggregated for chart rendering. Computed from CachedRelease on demand.

| Field | Type | Description |
|-------|------|-------------|
| `project_id` | UUID | Project.id |
| `releases_per_week` | list[{week, count}] | Bucketed counts (last 90 days) |
| `average_cycle_days` | float | Mean days between consecutive releases |
| `on_track` | boolean | True if average_cycle_days ≤ release_cycle_days × 1.1 |

---

## State Transitions: Data Freshness

```
FRESH (< 5 min)  →  STALE (5–10 min)  →  VERY_STALE (> 10 min)
```

- FRESH / STALE: serve cached data without flag.
- VERY_STALE: serve cached data with `data_stale: true`.
- Background refresh runs every 5 minutes per project.
- On refresh, credentials are passed from the frontend request; the backend does NOT
  store credentials.

---

## Credential Flow (No Server Storage)

```
Browser localStorage
    │ (token + URL sent as request headers)
    ▼
FastAPI backend
    │ (uses token only for this request, never persists)
    ▼
YouTrack / Azure DevOps REST API
    │ (returns release data)
    ▼
FastAPI backend
    │ (writes CachedRelease to PostgreSQL)
    ▼
Browser
```

---

## Environment Variables (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string, e.g., `postgresql://user:pass@host:5432/releasly` |
| `CACHE_TTL_SECONDS` | optional | Default: `300` (5 minutes) |
| `PORT` | optional | Backend port, default `8000` |
| `FRONTEND_ORIGIN` | optional | CORS origin for frontend, default `http://localhost:3000` |
