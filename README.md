# Releasly

Internal release management dashboard for GASAG product teams. Tracks release cadences, aggregates release notes, and surfaces overdue or stale projects — all in one place.

---

## What it does

- **Dashboard** — overview of all projects with current version, last release date, and overdue status
- **Release timeline** — per-project release history with frequency sparkline
- **Release notes** — rendered Markdown with automatic YouTrack ticket extraction and linking
- **Dual integration** — fetches data from both YouTrack and Azure DevOps per project
- **Credential privacy** — integration tokens live only in the browser; the server never stores them

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2 (async) |
| Database | PostgreSQL 18 |
| Auth | Microsoft Entra ID via Auth.js v5 |
| Migrations | Alembic |
| Design | GASAG design system (Open Sans, dark blue + yellow) |

---

## Project structure

```
releasly/
├── frontend/          # Next.js application
│   └── src/
│       ├── app/       # App Router pages
│       ├── components/
│       ├── context/
│       ├── services/  # API client
│       └── types/
└── backend/           # FastAPI application
    ├── app/
    │   ├── models/    # SQLAlchemy ORM + Pydantic schemas
    │   ├── routers/   # API endpoints
    │   └── services/  # YouTrack + Azure DevOps clients
    └── alembic/       # Database migrations
```

---

## Getting started

### Prerequisites

- Node.js 24 LTS
- Python 3.12
- PostgreSQL 18
- A Microsoft Entra ID app registration (for production auth)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create .env
echo "DATABASE_URL=postgresql+asyncpg://releasly:releasly@localhost:5432/releasly" > .env

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install

# Copy and fill in .env.local
cp .env.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Auth.js signing secret |
| `NEXTAUTH_URL` | Base URL (e.g. `http://localhost:3000`) |
| `AZURE_AD_CLIENT_ID` | Entra ID app client ID |
| `AZURE_AD_CLIENT_SECRET` | Entra ID app client secret |
| `AZURE_AD_TENANT_ID` | Entra ID tenant ID |
| `NEXT_PUBLIC_DEV_AUTH` | Set to `true` to enable dev login bypass (local only) |
| `BACKEND_URL` | Backend origin (defaults to `http://localhost:8000`) |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg) |

---

## Integration credentials

YouTrack tokens and Azure DevOps PATs are **never sent to or stored on the server**. They are stored in `localStorage` and forwarded as request headers per API call:

| Header | Purpose |
|--------|---------|
| `X-YouTrack-Token` | YouTrack bearer token |
| `X-YouTrack-Url` | YouTrack base URL |
| `X-AzureDevOps-Pat` | Azure DevOps personal access token |
| `X-AzureDevOps-Url` | Azure DevOps organisation URL |

Configure them at `/setup` after first login.

---

## Adding a project

Every project requires all three integration fields:

- **YouTrack Project ID** — e.g. `MYAPP`
- **Azure DevOps Project** — e.g. `MyProject`
- **Azure DevOps Repository** — e.g. `my-repo`

---

## Development notes

- `NEXT_PUBLIC_DEV_AUTH=true` adds a "Dev Login" button that bypasses Entra ID. **Never set this in production.**
- Background refresh runs every 10 minutes server-side (no credentials → serves cached data).
- The `/setup` page is shown automatically when no credentials are found in `localStorage`.

---

## License

Internal use only — GASAG Group.
