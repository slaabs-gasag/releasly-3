# Data Model: Pflichtfelder für duale Integrationskonfiguration

## Entity: Project (updated)

### Fields

| Field | Type | Nullable | Constraints | Change |
|-------|------|----------|-------------|--------|
| `id` | UUID | No | PK | — unchanged |
| `slug` | VARCHAR(100) | No | UNIQUE, INDEX | — unchanged |
| `name` | VARCHAR(200) | No | | — unchanged |
| ~~`source`~~ | ~~ENUM~~ | ~~No~~ | ~~releasesource~~ | **REMOVED** |
| `youtrack_project_id` | VARCHAR(200) | **No** | min_length=1 | **Was nullable** |
| `azuredevops_project` | VARCHAR(200) | **No** | min_length=1 | **Was nullable** |
| `azuredevops_repository` | VARCHAR(200) | **No** | min_length=1 | **Was nullable** |
| `naming_convention` | ENUM | No | semver/date/unknown | — unchanged |
| `release_cycle_days` | INTEGER | No | default=14 | — unchanged |
| `created_at` | TIMESTAMPTZ | No | server default NOW() | — unchanged |
| `updated_at` | TIMESTAMPTZ | No | server default NOW() | — unchanged |

### Removed Enum

- `releasesource` PostgreSQL enum type (`youtrack`, `azuredevops`) — **DROPPED**

### Relationships

- `cached_releases`: one-to-many → `CachedRelease` — unchanged

---

## Migration: 002_remove_source_add_dual_required

### Upgrade steps (in order)

1. Backfill NULL `youtrack_project_id` with `''` (safety guard)
2. Backfill NULL `azuredevops_project` with `''`
3. Backfill NULL `azuredevops_repository` with `''`
4. `ALTER TABLE projects ALTER COLUMN youtrack_project_id SET NOT NULL`
5. `ALTER TABLE projects ALTER COLUMN azuredevops_project SET NOT NULL`
6. `ALTER TABLE projects ALTER COLUMN azuredevops_repository SET NOT NULL`
7. `ALTER TABLE projects DROP COLUMN source`
8. `DROP TYPE releasesource`

### Downgrade steps (in order)

1. `CREATE TYPE releasesource AS ENUM ('youtrack', 'azuredevops')`
2. `ALTER TABLE projects ADD COLUMN source releasesource`
3. `UPDATE projects SET source = 'youtrack'` (default for rollback)
4. `ALTER TABLE projects ALTER COLUMN source SET NOT NULL`
5. `ALTER TABLE projects ALTER COLUMN youtrack_project_id DROP NOT NULL`
6. `ALTER TABLE projects ALTER COLUMN azuredevops_project DROP NOT NULL`
7. `ALTER TABLE projects ALTER COLUMN azuredevops_repository DROP NOT NULL`

---

## Pydantic Schema Changes

### ProjectCreate (before → after)

```python
# BEFORE
class ProjectCreate(BaseModel):
    name: str
    source: ReleaseSource            # REMOVED
    youtrack_project_id: str | None = None   # optional
    azuredevops_project: str | None = None   # optional
    azuredevops_repository: str | None = None # optional
    naming_convention: NamingConvention = NamingConvention.semver
    release_cycle_days: int = 14

# AFTER
class ProjectCreate(BaseModel):
    name: str
    youtrack_project_id: str         # required, min_length=1
    azuredevops_project: str         # required, min_length=1
    azuredevops_repository: str      # required, min_length=1
    naming_convention: NamingConvention = NamingConvention.semver
    release_cycle_days: int = 14
```

### ProjectUpdate (before → after)

```python
# BEFORE
class ProjectUpdate(BaseModel):
    name: str | None = None
    source: ReleaseSource | None = None      # REMOVED
    youtrack_project_id: str | None = None
    azuredevops_project: str | None = None
    azuredevops_repository: str | None = None
    naming_convention: NamingConvention | None = None
    release_cycle_days: int | None = None

# AFTER — all fields remain optional (partial update semantics)
class ProjectUpdate(BaseModel):
    name: str | None = None
    youtrack_project_id: str | None = None
    azuredevops_project: str | None = None
    azuredevops_repository: str | None = None
    naming_convention: NamingConvention | None = None
    release_cycle_days: int | None = None
```

### ProjectSummary (before → after)

```python
# BEFORE
class ProjectSummary(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    source: ReleaseSource            # REMOVED
    ...

# AFTER
class ProjectSummary(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    # source removed
    ...
```

---

## Frontend Type Changes

### api.ts (before → after)

```typescript
// REMOVE
export type ReleaseSource = "youtrack" | "azuredevops";

// ProjectSummary: remove source field
// ProjectCreate: remove source field, make 3 integration fields required (no ?)
```
