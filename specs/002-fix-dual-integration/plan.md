# Implementation Plan: Pflichtfelder für duale Integrationskonfiguration

**Branch**: `002-fix-dual-integration` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-fix-dual-integration/spec.md`

## Summary

Remove the `source` either/or field from the `projects` data model. All three integration fields (`youtrack_project_id`, `azuredevops_project`, `azuredevops_repository`) become mandatory on every project. The project creation/edit form always shows all three fields with no toggle. A database migration enforces NOT NULL constraints and drops the obsolete `source` column.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript / Node.js 24.15.0 (frontend)

**Primary Dependencies**:
- Backend: FastAPI, SQLAlchemy 2 async, Pydantic v2, Alembic
- Frontend: Next.js 16.2.6, React 19, TypeScript

**Storage**: PostgreSQL 18.4 via async SQLAlchemy; Alembic for schema migrations

**Testing**: No new test framework — constitution V.5 requires integration tests; migration tested via Alembic upgrade/downgrade round-trip

**Target Platform**: Linux server (backend), browser (frontend)

**Project Type**: Web application — backend API + Next.js frontend

**Performance Goals**: Form validation within 1 second (client-side, no latency)

**Constraints**: DB migration must be backward-safe on empty/dev databases; no production data exists yet, so destructive migration is acceptable

**Scale/Scope**: Single-table change (`projects`), 4 files across backend, 3 files across frontend

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Automation-First | ✅ PASS | Form no longer requires user to choose source — all fields always visible |
| II. Zero-Config Defaults | ✅ PASS | No new config options; simpler model |
| III. Progressive Disclosure | ✅ PASS | Form complexity reduced; all required fields upfront |
| IV. Reliability & Observability | ✅ PASS | DB NOT NULL constraints enforce integrity at storage layer |
| V. Test-Driven Automation | ⚠️ NOTED | No test suite exists yet; migration correctness verified by Alembic round-trip |

No violations — no Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-dual-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── project-create.md
│   └── project-update.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (affected files)

```text
backend/
├── app/
│   ├── models/
│   │   ├── db.py                          # Remove ReleaseSource enum + source column; make 3 fields NOT NULL
│   │   └── project.py                     # Remove source from schemas; make 3 fields required
│   └── routers/
│       └── projects.py                    # Remove source from create/update/summary logic
└── alembic/
    └── versions/
        └── 002_remove_source_add_dual_required.py  # New migration

frontend/
└── src/
    ├── types/
    │   └── api.ts                         # Remove ReleaseSource type; update ProjectSummary + ProjectCreate
    ├── components/
    │   └── ProjectForm.tsx                # Remove source dropdown; always show all 3 fields; update validation
    └── app/
        └── projects/
            └── [id]/
                └── page.tsx               # Remove source-based display logic
```
