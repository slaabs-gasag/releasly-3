# Contract: POST /api/projects

## Request

**Method**: POST  
**Path**: `/api/projects`  
**Content-Type**: `application/json`

### Body

```json
{
  "name": "string (required, non-empty)",
  "youtrack_project_id": "string (required, non-empty)",
  "azuredevops_project": "string (required, non-empty)",
  "azuredevops_repository": "string (required, non-empty)",
  "naming_convention": "semver | date | unknown (default: semver)",
  "release_cycle_days": "integer >= 1 (default: 14)"
}
```

### Removed field (was present before this feature)

- `source`: no longer accepted — removed from schema

## Response: 201 Created

```json
{
  "id": "uuid",
  "slug": "string",
  "name": "string",
  "youtrack_project_id": "string",
  "azuredevops_project": "string",
  "azuredevops_repository": "string",
  "naming_convention": "semver | date | unknown",
  "release_cycle_days": 14,
  "current_version": null,
  "last_release_date": null,
  "is_overdue": false,
  "days_since_release": null,
  "data_stale": false,
  "data_fetched_at": null
}
```

### Removed field from response

- `source`: no longer returned — removed from ProjectSummary

## Error Responses

| Status | Condition |
|--------|-----------|
| 409 Conflict | Project slug already exists |
| 422 Unprocessable Entity | Missing/empty required field |

### 422 example (missing youtrack_project_id)

```json
{
  "detail": [
    {
      "loc": ["body", "youtrack_project_id"],
      "msg": "String should have at least 1 character",
      "type": "string_too_short"
    }
  ]
}
```
