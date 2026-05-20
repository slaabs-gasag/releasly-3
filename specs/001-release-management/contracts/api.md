# API Contract: Releasly Backend

**Version**: 1.1 | **Base URL**: `http://localhost:8000` (dev) | **Date**: 2026-05-20

All endpoints return JSON. Errors follow RFC 7807 Problem Details format.

## Authentication / Credential Passing

User credentials (YouTrack token, Azure DevOps PAT) are stored in browser localStorage
and sent to the backend per-request via HTTP headers. The backend uses these credentials
only to call the integration source for this request and NEVER persists them.

| Header | Required when | Value |
|--------|--------------|-------|
| `X-YouTrack-Token` | project uses YouTrack | Bearer token from user settings |
| `X-YouTrack-Url` | project uses YouTrack | YouTrack base URL from user settings |
| `X-AzureDevOps-Pat` | project uses Azure DevOps | PAT from user settings |
| `X-AzureDevOps-Url` | project uses Azure DevOps | Azure DevOps org URL from user settings |

---

## Projects

### GET /api/projects

Returns all projects from the database with their latest cached release summary.

**Request**: No parameters.

**Response 200**:
```json
{
  "projects": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "my-app",
      "name": "My Application",
      "source": "youtrack",
      "current_version": "2.3.1",
      "last_release_date": "2026-05-10T14:00:00Z",
      "is_overdue": false,
      "days_since_release": 10,
      "release_cycle_days": 14,
      "data_stale": false,
      "data_fetched_at": "2026-05-20T08:00:00Z"
    }
  ],
  "fetched_at": "2026-05-20T08:00:00Z"
}
```

**Error responses**:
- `503 Service Unavailable` — database unreachable

---

### POST /api/projects

Create a new project.

**Request body**:
```json
{
  "slug": "my-app",
  "name": "My Application",
  "source": "youtrack",
  "youtrack_project_id": "MY_PROJECT",
  "naming_convention": "semver",
  "release_cycle_days": 14
}
```

For Azure DevOps projects:
```json
{
  "slug": "another-app",
  "name": "Another Application",
  "source": "azuredevops",
  "azuredevops_project": "AnotherProject",
  "azuredevops_repository": "another-repo",
  "naming_convention": "date",
  "release_cycle_days": 7
}
```

**Response 201**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "slug": "my-app",
  "name": "My Application",
  "source": "youtrack",
  "youtrack_project_id": "MY_PROJECT",
  "naming_convention": "semver",
  "release_cycle_days": 14,
  "created_at": "2026-05-20T08:00:00Z"
}
```

**Error responses**:
- `400 Bad Request` — validation failure (missing required fields, invalid slug)
- `409 Conflict` — slug already exists

---

### PUT /api/projects/{id}

Update an existing project.

**Path parameters**:
- `id` (UUID): Project.id

**Request body**: Same as POST (all fields).

**Response 200**: Updated project object.

**Error responses**:
- `400 Bad Request` — validation failure
- `404 Not Found` — project not found
- `409 Conflict` — slug conflict with another project

---

### DELETE /api/projects/{id}

Delete a project and its cached release data.

**Path parameters**:
- `id` (UUID): Project.id

**Response 204**: No content.

**Error responses**:
- `404 Not Found` — project not found

---

## Releases

### GET /api/projects/{id}/releases

Returns release history for a project. Fetches live from integration source using
credentials from request headers; falls back to cache on failure.

**Path parameters**:
- `id` (UUID): Project.id

**Query parameters**:
- `limit` (int, optional, default `50`): Max releases to return
- `offset` (int, optional, default `0`): Pagination offset

**Request headers**: Credential headers (see Authentication section above).

**Response 200**:
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_name": "My Application",
  "naming_convention": "semver",
  "releases": [
    {
      "version": "2.3.1",
      "release_date": "2026-05-10T14:00:00Z",
      "release_notes": "## What's new\n- Feature X\n- Bug Y fixed",
      "naming_convention": "semver",
      "is_convention_match": true
    }
  ],
  "total": 47,
  "data_stale": false,
  "source": "live"
}
```

`source` is either `"live"` (fetched from integration) or `"cache"` (fallback).

**Error responses**:
- `404 Not Found` — project not found
- `401 Unauthorized` — credentials missing or rejected by integration source
- `503 Service Unavailable` — integration source unreachable and no cache available

---

### GET /api/projects/{id}/releases/{version}

Returns details for a single release.

**Path parameters**:
- `id` (UUID): Project.id
- `version` (string, URL-encoded): Release version string

**Request headers**: Credential headers.

**Response 200**:
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "version": "2.3.1",
  "release_date": "2026-05-10T14:00:00Z",
  "release_notes": "## What's new\n- Feature X",
  "naming_convention": "semver",
  "is_convention_match": true
}
```

**Error responses**:
- `401 Unauthorized` — credentials missing or invalid
- `404 Not Found` — project or version not found

---

## Stats

### GET /api/stats

Returns aggregated release statistics for chart rendering.

**Query parameters**:
- `days` (int, optional, default `90`): Lookback window in days

**Request headers**: Not required — stats are computed from the PostgreSQL cache.

**Response 200**:
```json
{
  "stats": [
    {
      "project_id": "550e8400-e29b-41d4-a716-446655440000",
      "releases_per_week": [
        {"week": "2026-03-02", "count": 2},
        {"week": "2026-03-09", "count": 1}
      ],
      "average_cycle_days": 7.3,
      "on_track": true
    }
  ],
  "computed_at": "2026-05-20T08:00:00Z"
}
```

---

## Health

### GET /api/health

**Response 200**:
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Response 503** (database unreachable):
```json
{
  "status": "degraded",
  "database": "unreachable"
}
```

---

## Error Format (RFC 7807)

```json
{
  "type": "https://releasly/errors/not-found",
  "title": "Project not found",
  "status": 404,
  "detail": "No project with id '550e8400-...' exists",
  "instance": "/api/projects/550e8400-.../releases"
}
```

---

## CORS

Backend serves CORS headers allowing requests from `http://localhost:3000` (dev) and
the production frontend origin configured via `FRONTEND_ORIGIN` env var.
