import logging
import re
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db import Project
from app.models.project import ProjectCreate, ProjectSummary, ProjectUpdate
from app.services import release_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _slugify(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")[:80]


def _project_to_summary(project: Project, latest_cache=None) -> ProjectSummary:
    from datetime import datetime, timezone

    current_version = None
    last_release_date = None
    is_overdue = False
    days_since_release = None
    data_stale = False
    data_fetched_at = None

    if latest_cache:
        current_version = latest_cache.version
        last_release_date = latest_cache.release_date
        data_fetched_at = latest_cache.fetched_at
        now = datetime.now(timezone.utc)
        fetched_at_aware = (
            latest_cache.fetched_at.replace(tzinfo=timezone.utc)
            if latest_cache.fetched_at.tzinfo is None
            else latest_cache.fetched_at
        )
        data_stale = (now - fetched_at_aware).total_seconds() > 600
        if last_release_date:
            release_aware = (
                last_release_date.replace(tzinfo=timezone.utc)
                if last_release_date.tzinfo is None
                else last_release_date
            )
            days_since_release = (now - release_aware).days
            is_overdue = days_since_release > project.release_cycle_days

    return ProjectSummary(
        id=project.id,
        slug=project.slug,
        name=project.name,
        youtrack_project_id=project.youtrack_project_id,
        azuredevops_project=project.azuredevops_project,
        azuredevops_repository=project.azuredevops_repository,
        naming_convention=project.naming_convention,
        release_cycle_days=project.release_cycle_days,
        current_version=current_version,
        last_release_date=last_release_date,
        is_overdue=is_overdue,
        days_since_release=days_since_release,
        data_stale=data_stale,
        data_fetched_at=data_fetched_at,
    )


@router.get("/projects", response_model=list[ProjectSummary])
async def list_projects(db: AsyncSession = Depends(get_db)):
    try:
        return await release_service.get_project_summaries(db)
    except OperationalError as exc:
        logger.error("DB unreachable: %s", exc)
        raise HTTPException(status_code=503, detail="Database unavailable")


@router.post("/projects", response_model=ProjectSummary, status_code=201)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    slug = _slugify(data.name)
    existing = await db.execute(select(Project).where(Project.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Project slug '{slug}' already exists")

    project = Project(
        id=uuid.uuid4(),
        slug=slug,
        name=data.name,
        youtrack_project_id=data.youtrack_project_id,
        azuredevops_project=data.azuredevops_project,
        azuredevops_repository=data.azuredevops_repository,
        naming_convention=data.naming_convention,
        release_cycle_days=data.release_cycle_days,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return _project_to_summary(project)


@router.put("/projects/{project_id}", response_model=ProjectSummary)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    return _project_to_summary(project)


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
