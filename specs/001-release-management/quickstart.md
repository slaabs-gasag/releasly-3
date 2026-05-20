# Quickstart: Releasly

**Branch**: `001-release-management` | **Date**: 2026-05-20

## Prerequisites

- Python 3.12+
- Node.js 24.15.0 LTS+
- PostgreSQL 18.4+
- Personal access credentials for YouTrack and/or Azure DevOps

## 1. Clone & Configure

```bash
cp .env.example .env
```

Edit `.env` (backend):

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/releasly

# Optional
CACHE_TTL_SECONDS=300
PORT=8000
FRONTEND_ORIGIN=http://localhost:3000
```

Create `frontend/.env.local`:

```env
# Azure Entra ID app registration (required for production sign-in)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# NextAuth.js
NEXTAUTH_SECRET=a-long-random-secret-string
NEXTAUTH_URL=http://localhost:3000

# Enable dev login bypass (ONLY for local development — never set in production)
NEXT_PUBLIC_DEV_AUTH=true
```

> **Note**: YouTrack and Azure DevOps tokens are NOT stored in any server config.
> Each user enters their own credentials in the browser settings after signing in.

## 2. Set Up PostgreSQL

```bash
createdb releasly

cd backend
pip install -r requirements.txt
alembic upgrade head     # creates projects + cached_releases tables
```

## 3. Start Backend

```bash
uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/api/health`

Expected: `{"status":"ok","database":"connected"}`

## 4. Start Frontend

```bash
cd frontend
npm install    # installs Next.js 15, React 19, Tailwind v4, Auth.js
npm run dev
```

Open: `http://localhost:3000`

## 5. First-Time User Setup (in browser)

1. Open `http://localhost:3000`
2. The sign-in screen appears. In local dev, click **Dev Login** to bypass Entra ID.
3. After signing in, the integration credential setup screen appears.
4. Enter:
   - **YouTrack base URL** (e.g., `https://youtrack.example.com`)
   - **YouTrack bearer token** (your personal permanent token)
   - **Azure DevOps org URL** (e.g., `https://dev.azure.com/my-org`)
   - **Azure DevOps PAT** (your personal access token)
5. Click **Save** — credentials are stored in your browser only

## 6. Add Your First Project

1. Click **Add Project** on the dashboard
2. Fill in:
   - Name: `My Application`
   - Source: `YouTrack` or `Azure DevOps`
   - Project ID / Project + Repository (from your integration source)
   - Naming convention: `semver` or `date`
   - Release cycle: e.g., `14` (days)
3. Click **Save** — project appears on dashboard immediately

## 7. Validate Installation

1. Dashboard loads and shows added projects
2. Each project card shows a version number and last release date
3. Clicking a project card shows release history with notes
4. Charts are visible on the dashboard

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| "Authentication required" on project card | Token missing or expired | Open Settings and update your token |
| Project card shows "stale" badge | Integration source unreachable | Check token validity and network |
| Version shows ⚠ icon | Version doesn't match naming convention | Update `naming_convention` in project settings |
| Dashboard blank / "Server error" | Backend not running or DB unreachable | Check `DATABASE_URL` in `.env` and restart backend |
| Sign-in redirect loop | `NEXTAUTH_SECRET` or Entra ID config wrong | Check `frontend/.env.local` values |
| "Dev Login" button not visible | `NEXT_PUBLIC_DEV_AUTH` not set to `true` | Set it in `frontend/.env.local` |
| Credential setup screen reappears | Browser localStorage was cleared | Re-enter integration credentials in the setup screen |

## Re-running Migrations (after code update)

```bash
cd backend
alembic upgrade head
```
