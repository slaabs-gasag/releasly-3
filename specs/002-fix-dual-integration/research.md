# Research: Pflichtfelder für duale Integrationskonfiguration

## Decision: Remove `source` column via Alembic migration

**Decision**: Add a new Alembic migration (`002_remove_source_add_dual_required.py`) that:
1. Backfills `NULL` values in the three integration columns with empty string `''` (safety for any existing rows)
2. Alters the three columns to `NOT NULL`
3. Drops the `source` column
4. Drops the `releasesource` PostgreSQL enum type

**Rationale**: No production data exists; dev databases are disposable. The migration is destructive but safe in this context. Alembic downgrade restores the column (with a default value) for round-trip safety.

**Alternatives considered**:
- Keep `source` as nullable: Rejected — leaves an orphan column that misleads future developers
- Soft-delete via `source='both'` value: Rejected — unnecessarily extends the enum and adds ambiguity

---

## Decision: Pydantic v2 field validation for required strings

**Decision**: Change `youtrack_project_id`, `azuredevops_project`, `azuredevops_repository` from `str | None = None` to `str` with `min_length=1` validator in `ProjectCreate`. In `ProjectUpdate`, keep as `str | None = None` (partial update semantics) but validate non-empty if provided.

**Rationale**: `min_length=1` rejects empty strings at the API layer before touching the database. FastAPI returns a 422 Unprocessable Entity with field-level errors automatically.

**Alternatives considered**:
- Custom validator with `.strip()` check: Valid approach, but `min_length=1` is simpler and sufficient

---

## Decision: Remove `source` from `ProjectSummary` response

**Decision**: Drop `source: ReleaseSource` from `ProjectSummary`. Frontend no longer needs it to conditionally show integration type.

**Rationale**: The `source` field was only used to: (a) drive conditional form rendering, and (b) display "YouTrack" vs "Azure DevOps" badge. Both are now obsolete — all projects have both integrations.

**Impact**: Frontend `ProjectSummary` type loses `source`; any display that showed integration type must be updated to show "YouTrack + Azure DevOps" statically.

---

## Decision: Frontend form always shows all three fields

**Decision**: Remove the `<select>` for `source` and the conditional rendering blocks. All three input fields (`youtrack_project_id`, `azuredevops_project`, `azuredevops_repository`) are always rendered and always required.

**Rationale**: Constitution principle I (Automation-First) and III (Progressive Disclosure) — the form should be unambiguous. No toggle needed.

**Alternatives considered**:
- Keep toggle but always validate both: Confusing UX — shows fields for one integration but requires the other

---

## Decision: Migration strategy for `ProjectUpdate`

**Decision**: `ProjectUpdate` keeps all fields optional (Pydantic `model_dump(exclude_unset=True)` pattern). The three integration fields in `ProjectUpdate` are `str | None = None` — a `None` value means "not provided in this PATCH", not "set to NULL". The router uses `exclude_unset=True`, so fields not sent are never written.

**Rationale**: PUT semantics in this API mean "update only what's sent". Making them required in `ProjectUpdate` would force every edit to resend all integration fields even when only changing `release_cycle_days`.

**Note**: If a caller explicitly sends `youtrack_project_id: null` in a PUT, Pydantic accepts it and the router writes NULL — this is an API contract gap. Acceptable for now; can be tightened with a custom validator if needed.
