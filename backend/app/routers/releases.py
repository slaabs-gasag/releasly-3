import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db import CachedRelease, Project
from app.models.errors import AuthenticationError, IntegrationUnavailableError
from app.models.release import Release

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/projects/{project_id}/releases")
async def get_releases(
    project_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
    x_youtrack_token: str | None = Header(default=None, alias="X-YouTrack-Token"),
    x_youtrack_url: str | None = Header(default=None, alias="X-YouTrack-Url"),
    x_azuredevops_pat: str | None = Header(default=None, alias="X-AzureDevOps-Pat"),
    x_azuredevops_url: str | None = Header(default=None, alias="X-AzureDevOps-Url"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    releases: list[Release] = []
    source = "live"

    try:
        fetched = False
        seen: set[str] = set()
        if x_azuredevops_pat and x_azuredevops_url:
            from app.services.azuredevops_service import AzureDevOpsService
            svc = AzureDevOpsService(org_url=x_azuredevops_url, pat=x_azuredevops_pat)
            for r in await svc.fetch_releases(project.azuredevops_project, project.azuredevops_repository):
                if r.version not in seen:
                    releases.append(r)
                    seen.add(r.version)
            fetched = True
        if x_youtrack_token and x_youtrack_url:
            from app.services.youtrack_service import YouTrackService
            svc = YouTrackService(base_url=x_youtrack_url, token=x_youtrack_token)
            for r in await svc.fetch_releases(project.youtrack_project_id):
                if r.version not in seen:
                    releases.append(r)
                    seen.add(r.version)
            fetched = True
        if not fetched:
            raise IntegrationUnavailableError("No credentials provided")
    except AuthenticationError:
        raise HTTPException(status_code=401, detail="Integration credentials rejected")
    except IntegrationUnavailableError:
        # Fall back to cached releases
        source = "cache"
        cache_result = await db.execute(
            select(CachedRelease)
            .where(CachedRelease.project_id == project_id)
            .order_by(CachedRelease.fetched_at.desc())
            .offset(offset)
            .limit(limit)
        )
        cached = cache_result.scalars().all()
        releases = [
            Release(
                version=c.version,
                release_date=c.release_date,
                release_notes=c.release_notes,
                naming_convention=c.naming_convention,
                is_convention_match=c.is_convention_match,
                source="cache",
            )
            for c in cached
        ]

    paginated = releases[offset : offset + limit]
    return {
        "releases": [r.model_dump() for r in paginated],
        "project_id": str(project_id),
        "source": source,
    }


@router.get("/projects/{project_id}/releases/{version}")
async def get_release_detail(
    project_id: uuid.UUID,
    version: str,
    x_youtrack_token: str | None = Header(default=None, alias="X-YouTrack-Token"),
    x_youtrack_url: str | None = Header(default=None, alias="X-YouTrack-Url"),
    x_azuredevops_pat: str | None = Header(default=None, alias="X-AzureDevOps-Pat"),
    x_azuredevops_url: str | None = Header(default=None, alias="X-AzureDevOps-Url"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Look up from cache
    cache_result = await db.execute(
        select(CachedRelease)
        .where(CachedRelease.project_id == project_id, CachedRelease.version == version)
        .limit(1)
    )
    cached = cache_result.scalar_one_or_none()
    if not cached:
        raise HTTPException(status_code=404, detail="Release not found")

    return Release(
        version=cached.version,
        release_date=cached.release_date,
        release_notes=cached.release_notes,
        naming_convention=cached.naming_convention,
        is_convention_match=cached.is_convention_match,
        source="cache",
    )
