# Quickstart: Dual Integration Config — Integration Scenarios

## Scenario 1: Create project with all required fields

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mein Projekt",
    "youtrack_project_id": "MP",
    "azuredevops_project": "MeinAzureProjekt",
    "azuredevops_repository": "mein-repo",
    "naming_convention": "semver",
    "release_cycle_days": 14
  }'
```

**Expected**: 201 Created, response includes all three integration fields, no `source` field.

---

## Scenario 2: Create project with missing youtrack_project_id

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mein Projekt",
    "azuredevops_project": "MeinAzureProjekt",
    "azuredevops_repository": "mein-repo"
  }'
```

**Expected**: 422 Unprocessable Entity — `youtrack_project_id` field error.

---

## Scenario 3: Create project with empty string

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mein Projekt",
    "youtrack_project_id": "",
    "azuredevops_project": "MeinAzureProjekt",
    "azuredevops_repository": "mein-repo"
  }'
```

**Expected**: 422 Unprocessable Entity — `youtrack_project_id` must have at least 1 character.

---

## Scenario 4: Update only release cycle (partial update)

```bash
curl -X PUT http://localhost:8000/api/projects/{id} \
  -H "Content-Type: application/json" \
  -d '{"release_cycle_days": 7}'
```

**Expected**: 200 OK — only `release_cycle_days` updated; all integration fields unchanged.

---

## Scenario 5: Frontend form — submit without filling all fields

1. Open `/projects/new`
2. Enter project name only
3. Click "Speichern"

**Expected**: Three field-level error messages appear (YouTrack-Projekt-ID, Azure DevOps-Projekt, Azure DevOps-Repository). Form not submitted.

---

## Scenario 6: Run database migration

```bash
cd backend
alembic upgrade 002
```

**Expected**: Migration runs cleanly. `projects` table: no `source` column, three integration fields are NOT NULL.

```bash
alembic downgrade 001
```

**Expected**: Migration reverts cleanly. `source` column restored with value `youtrack`, three integration fields nullable again.
