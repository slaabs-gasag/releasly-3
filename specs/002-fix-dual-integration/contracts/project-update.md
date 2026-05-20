# Contract: PUT /api/projects/{project_id}

## Request

**Method**: PUT  
**Path**: `/api/projects/{project_id}`  
**Content-Type**: `application/json`

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `project_id` | UUID | Project identifier |

### Body (all fields optional — partial update)

```json
{
  "name": "string (optional, non-empty if provided)",
  "youtrack_project_id": "string (optional, non-empty if provided)",
  "azuredevops_project": "string (optional, non-empty if provided)",
  "azuredevops_repository": "string (optional, non-empty if provided)",
  "naming_convention": "semver | date | unknown (optional)",
  "release_cycle_days": "integer >= 1 (optional)"
}
```

### Removed field (was present before this feature)

- `source`: no longer accepted

## Response: 200 OK

Same shape as POST 201 response — see `project-create.md`.

## Error Responses

| Status | Condition |
|--------|-----------|
| 404 Not Found | Project with given ID does not exist |
| 422 Unprocessable Entity | Invalid field value |
