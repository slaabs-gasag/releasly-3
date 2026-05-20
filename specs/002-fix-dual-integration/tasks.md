# Tasks: Pflichtfelder für duale Integrationskonfiguration

**Input**: Design documents from `specs/002-fix-dual-integration/`

**Feature**: Remove `source` either/or field; make YouTrack ID + Azure DevOps Project + Azure DevOps Repository mandatory on all projects.

**Affected files** (7):
- `backend/app/models/db.py`
- `backend/app/models/project.py`
- `backend/app/routers/projects.py`
- `backend/alembic/versions/002_remove_source_add_dual_required.py` (NEW)
- `frontend/src/types/api.ts`
- `frontend/src/components/ProjectForm.tsx`
- `frontend/src/app/page.tsx`

---

## Phase 1: Setup

**Purpose**: Create migration file scaffold; no other project initialization needed (existing codebase).

- [X] T001 Create Alembic migration file `backend/alembic/versions/002_remove_source_add_dual_required.py` with correct `revision`, `down_revision = "001"`, and empty `upgrade()`/`downgrade()` stubs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend schema changes that both user stories depend on. MUST be complete before story phases.

**⚠️ CRITICAL**: Both US1 and US2 depend on these backend + type changes.

- [X] T002 Implement `upgrade()` in `backend/alembic/versions/002_remove_source_add_dual_required.py`: backfill NULLs with `''`, ALTER three columns to NOT NULL, DROP COLUMN `source`, DROP TYPE `releasesource` (see data-model.md for exact SQL steps)
- [X] T003 Implement `downgrade()` in `backend/alembic/versions/002_remove_source_add_dual_required.py`: CREATE TYPE `releasesource`, ADD COLUMN `source` NOT NULL default `'youtrack'`, DROP NOT NULL on three columns (see data-model.md)
- [X] T004 Update `backend/app/models/db.py`: delete `ReleaseSource` enum class and `source: Mapped[ReleaseSource]` column; change `youtrack_project_id`, `azuredevops_project`, `azuredevops_repository` from `Mapped[str | None]` to `Mapped[str]` with `nullable=False`
- [X] T005 Update `backend/app/models/project.py`: remove `ReleaseSource` import; remove `source` field from `ProjectCreate`, `ProjectUpdate`, and `ProjectSummary`; change three integration fields in `ProjectCreate` from `str | None = None` to `str` with `Field(min_length=1)`
- [X] T006 Update `backend/app/routers/projects.py`: remove `source=data.source` from `Project(...)` constructor in `create_project`; remove `source=project.source` from `_project_to_summary()` return; remove `source: ReleaseSource` import
- [X] T007 Update `frontend/src/types/api.ts`: delete `ReleaseSource` type; remove `source: ReleaseSource` from `ProjectSummary`; remove `source: ReleaseSource` from `ProjectCreate`; change `youtrack_project_id?`, `azuredevops_project?`, `azuredevops_repository?` to required (remove `?`)

**Checkpoint**: Backend accepts/returns no `source` field; TypeScript types enforce all three integration fields as required.

---

## Phase 3: User Story 1 — Neues Projekt mit vollständiger Dual-Integration anlegen (Priority: P1) 🎯 MVP

**Goal**: Project creation form always shows all three integration fields as required; validation blocks submit if any are empty; backend rejects incomplete payloads with 422.

**Independent Test**: Open `/projects/new`, submit with only name filled → three field-level errors appear. Fill all fields → project created successfully. Verify via quickstart.md scenarios 1–3.

- [X] T008 [US1] Update `frontend/src/components/ProjectForm.tsx` `DEFAULT_FORM`: remove `source: "youtrack"` field; keep `youtrack_project_id: ""`, `azuredevops_project: ""`, `azuredevops_repository: ""`
- [X] T009 [US1] Update `frontend/src/components/ProjectForm.tsx` `useState` initial value for edit mode: replace hardcoded `""` values with `existing.youtrack_project_id ?? ""`, `existing.azuredevops_project ?? ""`, `existing.azuredevops_repository ?? ""`
- [X] T010 [US1] Update `frontend/src/components/ProjectForm.tsx` `handleSubmit` validation: remove `form.source === "youtrack"` and `form.source === "azuredevops"` conditional checks; replace with three unconditional required-field checks: `!form.youtrack_project_id?.trim()`, `!form.azuredevops_project?.trim()`, `!form.azuredevops_repository?.trim()`; set field-specific German error messages
- [X] T011 [US1] Update `frontend/src/components/ProjectForm.tsx` JSX: remove `<select>` for `source`; remove both conditional blocks (`{form.source === "youtrack" && ...}` and `{form.source === "azuredevops" && ...}`); render all three input fields unconditionally and always; update field labels to German if not already
- [X] T012 [US1] Update `frontend/src/components/ProjectForm.tsx` TypeScript: remove `ReleaseSource` import from `@/types/api`; remove `source` from the `ProjectCreate` usage; update `import` statement accordingly

**Checkpoint**: Create form shows YouTrack-Projekt-ID, Azure DevOps-Projekt, Azure DevOps-Repository at all times. Submitting without all three blocked with German error messages.

---

## Phase 4: User Story 2 — Bestehendes Projekt bearbeiten (Priority: P2)

**Goal**: Edit form pre-fills all three integration fields from existing project data; same validation rules as create.

**Independent Test**: Open edit page for any project. All three integration fields show existing values (not empty). Clear one field and save → error message. Fill all and save → success.

**Note**: Most of the edit form logic is already handled in Phase 3 (T009 covers pre-filling). These tasks handle the remaining edit-specific concerns.

- [X] T013 [US2] Update `frontend/src/app/projects/[id]/edit/page.tsx` header/layout: replace Tailwind classes with GASAG design system classes (`.topbar`, `.page` structure like other pages); replace "Edit Project" text with "Projekt bearbeiten"; add breadcrumb with Link to "/" (Dashboard) and `/projects/{id}` (Projektname)
- [X] T014 [US2] Verify `frontend/src/components/ProjectForm.tsx` submit button labels: confirm "edit" mode shows "Speichern" (not "Add Project"); confirm "create" mode shows "Projekt anlegen"; both buttons German

**Checkpoint**: Edit form pre-fills all three integration fields; validation and submission work identically to create form.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Remove remaining `source` references from display components; ensure consistent GASAG styling on edit page.

- [X] T015 [P] Update `frontend/src/app/page.tsx` `ProjectCard` component: remove `const source = project.source === "youtrack" ? "YouTrack" : "Azure DevOps"` line; replace `{source}` in JSX with static `"YouTrack + Azure DevOps"` or remove the integration type display entirely from the card meta row
- [X] T016 [P] Update `frontend/src/app/projects/[id]/page.tsx`: remove any conditional display based on `project.source`; replace `{project.source === "youtrack" ? "YouTrack" : "Azure DevOps"}` with `"YouTrack + Azure DevOps"` or remove source badge
- [X] T017 Run Alembic migration against dev database: `cd backend && alembic upgrade head`; verify `projects` table has no `source` column and three integration columns are NOT NULL
- [ ] T018 Validate quickstart.md scenarios 1–6 manually: create with all fields, create with missing field, create with empty string, partial PUT update, frontend form validation, migration round-trip

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001; BLOCKS Phase 3 and 4
- **Phase 3 (US1)**: Depends on Phase 2 complete — T008→T009→T010→T011→T012 sequential within story
- **Phase 4 (US2)**: Depends on Phase 3 complete (T009 is shared) — T013, T014 sequential
- **Phase 5 (Polish)**: T015 and T016 can run in parallel after Phase 2; T017 and T018 run after all phases

### Within Phase 2 (sequential — same file dependencies)

```
T002 → T003 (same file)
T004 (db.py)
T005 (project.py, depends on T004 for import cleanup)
T006 (projects.py, depends on T004+T005)
T007 (frontend types, independent of T002-T006)
```

T004, T005, T006 must be sequential (cascading imports). T007 is independent.

### Within Phase 3 (sequential — same file: ProjectForm.tsx)

```
T008 → T009 → T010 → T011 → T012
```

All in same file; execute in order.

---

## Parallel Example: Phase 2

```
# These can run in parallel (different files):
T002+T003: migration file
T004: db.py  ← then T005, T006 chain follows
T007: frontend/src/types/api.ts (independent of backend)
```

---

## Implementation Strategy

### MVP (US1 only)

1. Complete Phase 1 (T001)
2. Complete Phase 2 (T002–T007) — backend + types
3. Complete Phase 3 (T008–T012) — form changes
4. Run T017 (migration)
5. **Validate**: Create project, confirm all three fields required

### Full Delivery

1. MVP above
2. Phase 4 (T013–T014) — edit form polish
3. Phase 5 (T015–T018) — display cleanup + validation

---

## Notes

- No new test framework; validation via manual quickstart.md scenarios
- Pydantic v2: use `Field(min_length=1)` not `@validator` for required non-empty strings
- `ProjectUpdate` keeps all fields optional (`str | None = None`) — partial update semantics preserved
- After T004 (db.py change), TypeScript may show errors — T007 fixes them; run both before checking
- The `releasesource` PostgreSQL enum type must be dropped separately from the column (T002 step 8)
