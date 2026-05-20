# Tasks: Internal Release Management Dashboard

**Input**: Design documents from `specs/001-release-management/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/api.md ✅ | research.md ✅

**Tests**: Integration tests included for automation-critical paths (constitution principle V).
Component unit tests included for credential handling (security boundary).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US6)
- File paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding, package configuration, tooling.

- [ ] T001 Create `backend/` directory structure per plan.md (`app/`, `alembic/`, `tests/`)
- [ ] T002 [P] Create `frontend/` directory structure per plan.md (`src/app/`, `src/components/`, `src/lib/`, etc.)
- [ ] T003 Create `backend/requirements.txt` with: fastapi, uvicorn[standard], httpx, pydantic[v2], python-dotenv, sqlalchemy[asyncio], asyncpg, alembic, respx
- [ ] T004 [P] Initialize Next.js 16.2.6 project in `frontend/` with TypeScript, App Router: `npx create-next-app@16.2.6 frontend --typescript --app --no-src-dir` then move into `src/` layout per plan.md
- [ ] T005 [P] Install frontend dependencies: `npm install next-auth recharts` in `frontend/`
- [ ] T006 Configure Tailwind v4 in `frontend/src/app/globals.css`: add `@import "tailwindcss"` and `@theme {}` block for design tokens; install `@tailwindcss/postcss`
- [ ] T007 [P] Create `backend/.env.example` with: `DATABASE_URL`, `CACHE_TTL_SECONDS`, `PORT`, `FRONTEND_ORIGIN`
- [ ] T008 Create `frontend/.env.example` with: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_DEV_AUTH`
- [ ] T009 Create `frontend/next.config.ts` with: `rewrites` proxying `/api/*` to backend URL

**Checkpoint**: Both project trees exist, dependencies installable, `.env.example` files present.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database layer, shared models, core FastAPI app. Must complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T010 Create `backend/app/config.py`: load `DATABASE_URL`, `CACHE_TTL_SECONDS` (default 300), `PORT` (default 8000), `FRONTEND_ORIGIN` using `pydantic-settings` or `python-dotenv`
- [ ] T011 Create `backend/app/database.py`: SQLAlchemy 2.x async engine (`create_async_engine`), `AsyncSession` factory, `get_db` dependency
- [ ] T012 Create `backend/app/models/db.py`: SQLAlchemy ORM models — `Project` (id UUID PK, slug, name, source enum, youtrack_project_id, azuredevops_project, azuredevops_repository, naming_convention enum, release_cycle_days, created_at, updated_at) and `CachedRelease` (id UUID PK, project_id FK, version, release_date, release_notes, naming_convention, is_convention_match, fetched_at)
- [ ] T013 Create `backend/alembic/` init: `alembic init alembic` then configure `alembic/env.py` to use async engine and import ORM models
- [ ] T014 Create `backend/alembic/versions/001_initial_schema.py`: migration creating `projects` and `cached_releases` tables with all columns and indexes per data-model.md
- [ ] T015 Create `backend/app/main.py`: FastAPI app instance, CORS middleware (allow `FRONTEND_ORIGIN`), include routers (stub imports), lifespan context manager (background refresh task placeholder)
- [ ] T016 [P] Create `frontend/src/types/api.ts`: TypeScript interfaces matching all API contract response shapes from `contracts/api.md` — `ProjectSummary`, `Release`, `ReleaseStats`, `ApiError`
- [ ] T017 [P] Create `frontend/src/services/api.ts`: typed `fetch` wrappers for all API endpoints; reads credential headers from a passed-in settings object; exports `getProjects()`, `getProjectReleases()`, `getStats()`, `createProject()`, `updateProject()`, `deleteProject()`

**Checkpoint**: `alembic upgrade head` succeeds against a running PostgreSQL 18 instance.

---

## Phase 3: User Story 1 — Sign In (Priority: P1) 🎯 MVP prerequisite

**Goal**: Users must authenticate before accessing any content. Entra ID in production; Dev Login in local dev.

**Independent Test**: Open app with no session → sign-in page shown. Click Dev Login → redirected to dashboard. Reload → still on dashboard (session persists).

### Integration Tests for US1 (constitution: auth is automation-critical boundary)

- [ ] T018 [P] [US1] Write `frontend/tests/e2e/auth.spec.ts`: test (a) unauthenticated user redirected to `/auth/signin`, (b) Dev Login button visible when `NEXT_PUBLIC_DEV_AUTH=true`, (c) after Dev Login session persists on reload, (d) sign-in page shown when `NEXT_PUBLIC_DEV_AUTH` unset — tests MUST fail before T020+

### Implementation for US1

- [ ] T019 [US1] Create `frontend/src/lib/auth.ts`: Auth.js v5 config with Entra ID provider (`AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`); add dev credentials provider (enabled only when `NEXT_PUBLIC_DEV_AUTH=true`) that signs in as a hardcoded dev user without network calls
- [ ] T020 [P] [US1] Create `frontend/src/app/auth/[...nextauth]/route.ts`: Auth.js route handler exporting `GET` and `POST` from `auth.ts`
- [ ] T021 [P] [US1] Create `frontend/src/middleware.ts`: protect all routes except `/auth/*`; redirect unauthenticated requests to `/auth/signin`
- [ ] T022 [US1] Create `frontend/src/app/auth/signin/page.tsx`: sign-in screen with Entra ID sign-in button; conditionally render Dev Login button only when `NEXT_PUBLIC_DEV_AUTH=true` (checked at build/runtime); no app content visible without session
- [ ] T023 [P] [US1] Create `frontend/src/components/SignInButton.tsx`: triggers Auth.js `signIn('azure-ad')` on click
- [ ] T024 [P] [US1] Create `frontend/src/components/DevLoginButton.tsx`: triggers Auth.js `signIn('credentials')` with dev user; rendered only when `process.env.NEXT_PUBLIC_DEV_AUTH === 'true'`

**Checkpoint**: Dev Login achieves session; `/` redirects to `/auth/signin` when no session; Dev Login disabled when env var absent.

---

## Phase 4: User Story 2 — Integration Credential Setup (Priority: P1)

**Goal**: Signed-in users who lack integration credentials are prompted to enter them before using the dashboard.

**Independent Test**: After Dev Login with no localStorage credentials → credential setup screen shown. Fill in YouTrack URL + token and DevOps URL + PAT → save → dashboard loads. Return → setup screen not shown again.

### Implementation for US2

- [ ] T025 [US2] Create `frontend/src/context/UserSettingsContext.tsx`: React context wrapping localStorage key `releasly_user_settings`; exposes `settings`, `saveSettings()`, `hasCredentials()` (returns true when at least one source has URL + token); never transmits values to server
- [ ] T026 [US2] Create `frontend/src/app/setup/page.tsx`: setup screen shown to signed-in users with `!hasCredentials()`; renders `<CredentialSetupForm />`
- [ ] T027 [US2] Create `frontend/src/components/CredentialSetupForm.tsx`: form with fields for YouTrack base URL, YouTrack bearer token, Azure DevOps org URL, Azure DevOps PAT; validates non-empty; on submit calls `saveSettings()` and redirects to `/`
- [ ] T028 [US2] Update `frontend/src/app/layout.tsx`: wrap children in `SessionProvider` (Auth.js) and `UserSettingsProvider`; add redirect logic — if signed in but `!hasCredentials()`, redirect to `/setup`

**Checkpoint**: US1 + US2 independently testable: sign in → setup prompt → fill credentials → dashboard (even if empty).

---

## Phase 5: User Story 3 — App Portfolio Overview (Priority: P2)

**Goal**: Dashboard shows all configured projects with version, overdue status, and integration source.

**Independent Test**: With one project in the database and YouTrack/DevOps responding, the dashboard shows the project card with version and last release date within 3 seconds.

### Integration Tests for US3 (constitution: automation-critical fetch + cache logic)

- [ ] T029 [P] [US3] Write `backend/tests/integration/test_youtrack_service.py`: mock YouTrack API responses with `respx`; test (a) happy-path returns Release list, (b) 401 raises `AuthenticationError`, (c) timeout raises `IntegrationUnavailableError` — MUST fail before T033
- [ ] T030 [P] [US3] Write `backend/tests/integration/test_azuredevops_service.py`: same pattern as T029 for Azure DevOps REST API — MUST fail before T034
- [ ] T031 [P] [US3] Write `backend/tests/integration/test_api_endpoints.py`: test `GET /api/projects` returns `200` with ProjectSummary list; test `503` when DB down; test stale flag when `fetched_at` > 10 min — MUST fail before T037

### Implementation for US3

- [ ] T032 [US3] Create `backend/app/models/project.py`: Pydantic models — `ProjectCreate`, `ProjectUpdate`, `ProjectSummary`, `ProjectDetail`; include `is_overdue` and `days_since_release` computed validators
- [ ] T033 [US3] Create `backend/app/services/youtrack_service.py`: async `YouTrackService` class taking `base_url` + `token` per-call; `fetch_releases(project_id) → list[Release]`; uses `httpx.AsyncClient`; raises typed errors on auth failure or timeout
- [ ] T034 [US3] Create `backend/app/services/azuredevops_service.py`: async `AzureDevOpsService` class taking `org_url` + `pat` per-call; `fetch_releases(project, repository) → list[Release]`; Basic auth with PAT; raises typed errors
- [ ] T035 [US3] Create `backend/app/models/release.py`: Pydantic models — `Release` (version, release_date, release_notes, naming_convention, is_convention_match), `ReleaseStats`; add `detect_naming_convention(version: str)` helper
- [ ] T036 [US3] Create `backend/app/services/release_service.py`: `get_project_summaries(db) → list[ProjectSummary]` — fetches latest `CachedRelease` per project from DB; computes `is_overdue`, `data_stale`; `refresh_project(project, headers, db)` — calls appropriate service, writes to `CachedRelease`, logs outcome
- [ ] T037 [US3] Create `backend/app/routers/projects.py`: `GET /api/projects` → calls `release_service.get_project_summaries()`; returns ProjectSummary list; handles DB error → 503
- [ ] T038 [US3] Update `backend/app/main.py`: register `projects` router; add lifespan background task calling `refresh_project` for each project every `CACHE_TTL_SECONDS`; log each refresh attempt and outcome
- [ ] T039 [P] [US3] Create `frontend/src/app/page.tsx`: dashboard page (server component); fetches `/api/projects`; renders `<ProjectGrid projects={...} />`; redirects to `/setup` if no credentials in context
- [ ] T040 [P] [US3] Create `frontend/src/components/ProjectGrid.tsx`: grid layout for `ProjectCard` list; shows empty-state with "Add Project" CTA when list is empty
- [ ] T041 [P] [US3] Create `frontend/src/components/ProjectCard.tsx`: displays project name, source badge, current version, last release date; renders `<OverdueIndicator />` if `is_overdue`; renders `<StaleIndicator />` if `data_stale`; links to `/projects/[id]`
- [ ] T042 [P] [US3] Create `frontend/src/components/OverdueIndicator.tsx`: visual flag (e.g., colored dot + label) shown when project is overdue
- [ ] T043 [P] [US3] Create `frontend/src/components/StaleIndicator.tsx`: shown when `data_stale` is true; displays `data_fetched_at` as relative time

**Checkpoint**: Dashboard renders project cards from database; overdue and stale indicators correct; integration tests pass.

---

## Phase 6: User Story 4 — Release History & Notes (Priority: P3)

**Goal**: Clicking a project shows full release history with markdown-rendered notes in reverse chronological order.

**Independent Test**: Click a project card → release detail page shows ≥ 10 releases with version labels and rendered notes. Semver projects show `X.Y.Z`; date projects show `YYYYMMDD.N`. No-notes releases show placeholder text.

### Implementation for US4

- [ ] T044 [US4] Create `backend/app/routers/releases.py`: `GET /api/projects/{id}/releases` — reads credential headers, calls appropriate service, falls back to cache on failure; sets `source: "live" | "cache"`; `GET /api/projects/{id}/releases/{version}` — single release detail; both endpoints return 401 when credentials rejected
- [ ] T045 [US4] Update `backend/app/services/youtrack_service.py`: add `fetch_release_detail(project_id, version_id) → Release` with release notes
- [ ] T046 [US4] Update `backend/app/services/azuredevops_service.py`: add `fetch_release_detail(project, repo, release_id) → Release` with release notes
- [ ] T047 [US4] Update `backend/app/main.py`: register `releases` router
- [ ] T048 [P] [US4] Create `frontend/src/app/projects/[id]/page.tsx`: project detail page; fetches `/api/projects/{id}/releases`; passes credential headers from `UserSettingsContext`; renders `<ReleaseList releases={...} />`; shows stale warning if `source === "cache"`
- [ ] T049 [P] [US4] Create `frontend/src/components/ReleaseList.tsx`: reverse-chronological list of releases; each item shows version, date, convention match indicator (⚠ if mismatch); expandable to show `<ReleaseNotes />`
- [ ] T050 [P] [US4] Create `frontend/src/components/ReleaseNotes.tsx`: renders markdown release notes using `react-markdown`; shows "No release notes provided." when notes are empty or null

**Checkpoint**: US4 independently testable: navigate to `/projects/[id]` → see full release history with notes rendered.

---

## Phase 7: User Story 5 — Project Management (Priority: P3)

**Goal**: Users add, edit, and delete projects through the UI; changes persist to the database immediately.

**Independent Test**: Open "Add Project", fill in a YouTrack project ID, save → project card appears on dashboard. Edit the project name → card updates. Delete → card removed.

### Implementation for US5

- [ ] T051 [US5] Update `backend/app/routers/projects.py`: add `POST /api/projects` (create), `PUT /api/projects/{id}` (update), `DELETE /api/projects/{id}` (delete with cascade to `cached_releases`); validate source-specific required fields; return 409 on slug conflict
- [ ] T052 [P] [US5] Create `frontend/src/components/ProjectForm.tsx`: reusable form for create and edit; fields: name, source (select), youtrack_project_id or azuredevops_project + repository (conditional on source), naming_convention (select), release_cycle_days (number); client-side validation; calls `createProject()` or `updateProject()` from `api.ts` on submit
- [ ] T053 [US5] Create `frontend/src/app/projects/new/page.tsx`: "Add Project" page; renders `<ProjectForm mode="create" />`; on success redirects to `/`
- [ ] T054 [US5] Update `frontend/src/components/ProjectCard.tsx`: add "Edit" and "Delete" actions; Edit opens ProjectForm in a modal or navigates to edit page; Delete shows confirmation dialog then calls `deleteProject()`
- [ ] T055 [P] [US5] Update `frontend/src/services/api.ts`: implement `createProject()`, `updateProject()`, `deleteProject()` with full request/response types from `api.ts`

**Checkpoint**: Full CRUD on projects via UI; new projects appear on dashboard without page reload.

---

## Phase 8: User Story 6 — Release Analytics Charts (Priority: P4)

**Goal**: Dashboard shows release frequency chart and cadence comparison automatically from cached data.

**Independent Test**: With ≥ 2 projects having ≥ 5 releases each, the dashboard MUST render at least one chart without any user action.

### Implementation for US6

- [ ] T056 [US6] Create `backend/app/routers/stats.py`: `GET /api/stats?days=90` — queries `CachedRelease` grouped by project and week; computes `releases_per_week`, `average_cycle_days`, `on_track`; returns `ReleaseStats` list; no credentials required (reads from cache)
- [ ] T057 [US6] Update `backend/app/main.py`: register `stats` router
- [ ] T058 [P] [US6] Create `frontend/src/components/charts/ReleaseFrequencyChart.tsx`: Recharts `BarChart` or `AreaChart` showing releases per week per project (last 90 days); tooltip shows version, date, project name on hover
- [ ] T059 [P] [US6] Create `frontend/src/components/charts/CadenceComparisonChart.tsx`: Recharts chart comparing actual `average_cycle_days` to configured `release_cycle_days` per project; `on_track` shown as color coding (green/red)
- [ ] T060 [US6] Update `frontend/src/app/page.tsx`: fetch `/api/stats` alongside project list; render `<ReleaseFrequencyChart />` and `<CadenceComparisonChart />` below the project grid; charts shown only when ≥ 1 project has release data

**Checkpoint**: Charts visible on dashboard without user interaction when release data exists in cache.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Health endpoint, structured logging, error handling, quickstart validation.

- [ ] T061 Create `backend/app/routers/stats.py` health endpoint: `GET /api/health` — checks DB connectivity; returns `{"status":"ok","database":"connected"}` or `{"status":"degraded","database":"unreachable"}` with 503
- [ ] T062 [P] Add structured logging to `backend/app/services/release_service.py`: log each fetch attempt (project id, source, outcome, duration); log each cache write; log each background refresh cycle start/end
- [ ] T063 [P] Add `backend/app/models/errors.py`: typed exception classes `AuthenticationError`, `IntegrationUnavailableError`, `ProjectNotFoundError`; wire to FastAPI exception handlers returning RFC 7807 Problem Details JSON
- [ ] T064 [P] Add frontend error boundaries: wrap dashboard and detail pages; show actionable error messages (credential error → link to `/setup`; server error → "Backend unavailable" with retry)
- [ ] T065 Validate `quickstart.md`: follow each step end-to-end in local environment; verify all 7 validation criteria in quickstart pass; update quickstart if any step is wrong

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — no other story dependencies
- **US2 (Phase 4)**: Depends on Foundational + US1 (needs session context)
- **US3 (Phase 5)**: Depends on Foundational + US2 (needs credentials in context)
- **US4 (Phase 6)**: Depends on US3 (needs release_service + integration services)
- **US5 (Phase 7)**: Depends on Foundational (needs DB); can run in parallel with US3/US4
- **US6 (Phase 8)**: Depends on US3 (needs CachedRelease data)
- **Polish (Phase 9)**: Depends on all user stories complete

### Parallel Opportunities Within Stories

**Phase 3 (US1)**:
```
# Run in parallel after T019:
T020 (route.ts) | T021 (middleware.ts) | T023 (SignInButton) | T024 (DevLoginButton)
```

**Phase 5 (US3)**:
```
# Run in parallel after T036:
Backend: T037 (router) — then T038 (register)
Frontend (parallel with backend): T039 | T040 | T041 | T042 | T043
```

**Phase 6 (US4)**:
```
# After T044 (router registered):
T045 + T046 (service detail methods) in parallel
T048 | T049 | T050 in parallel
```

---

## Implementation Strategy

### MVP (US1 + US2 only — auth + credential setup)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (US1: Sign In)
4. Complete Phase 4 (US2: Credential Setup)
5. **VALIDATE**: Dev Login works; credential form saves to localStorage; dashboard page renders (empty state OK)

### Incremental Delivery

1. MVP: Auth + Credential Setup (US1 + US2)
2. Add Portfolio: US3 → dashboard shows project cards from DB
3. Add Release History: US4 → click card → see notes
4. Add Project Management: US5 → add/edit/delete projects via UI
5. Add Charts: US6 → analytics visible on dashboard
6. Polish: T061–T065

### Parallel Team Strategy (if staffed)

After Phase 2 (Foundational) completes:
- **Dev A**: US1 + US2 (auth + credential setup — frontend-heavy)
- **Dev B**: US3 backend (release_service, routers, integration tests)
- **Dev C**: US3 frontend (ProjectCard, ProjectGrid, indicators)
- After US3 backend done: **Dev B** can take US4 backend, **Dev C** takes US5

---

## Notes

- `[P]` tasks = different files, no incomplete dependencies — safe to run in parallel
- `[Story]` label maps task to user story for traceability
- Integration tests (T018, T029–T031) MUST be written and failing before their implementation tasks begin (constitution principle V)
- Credential headers never stored server-side; always read from request in backend services
- Background refresh (T038) logs every attempt — required by constitution principle IV
- Verify tests fail before implementing; commit after each phase checkpoint
