import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import AsyncSessionFactory
from app.models.db import CachedRelease, NamingConvention, Project
from app.models.project import ProjectSummary
from app.models.release import Release, detect_naming_convention

logger = logging.getLogger(__name__)

STALE_THRESHOLD_SECONDS = 600  # 10 minutes


async def get_project_summaries(db: AsyncSession) -> list[ProjectSummary]:
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    summaries = []
    for project in projects:
        latest_q = await db.execute(
            select(CachedRelease)
            .where(CachedRelease.project_id == project.id)
            .order_by(CachedRelease.fetched_at.desc())
            .limit(1)
        )
        latest = latest_q.scalar_one_or_none()

        current_version = None
        last_release_date = None
        is_overdue = False
        days_since_release = None
        data_stale = False
        data_fetched_at = None

        if latest:
            current_version = latest.version
            last_release_date = latest.release_date
            data_fetched_at = latest.fetched_at
            now = datetime.now(timezone.utc)
            fetched_at_aware = latest.fetched_at.replace(tzinfo=timezone.utc) if latest.fetched_at.tzinfo is None else latest.fetched_at
            age_seconds = (now - fetched_at_aware).total_seconds()
            data_stale = age_seconds > STALE_THRESHOLD_SECONDS

            if last_release_date:
                release_aware = last_release_date.replace(tzinfo=timezone.utc) if last_release_date.tzinfo is None else last_release_date
                days_since_release = (now - release_aware).days
                is_overdue = days_since_release > project.release_cycle_days

        summaries.append(
            ProjectSummary(
                id=project.id,
                slug=project.slug,
                name=project.name,
                source=project.source,
                naming_convention=project.naming_convention,
                release_cycle_days=project.release_cycle_days,
                current_version=current_version,
                last_release_date=last_release_date,
                is_overdue=is_overdue,
                days_since_release=days_since_release,
                data_stale=data_stale,
                data_fetched_at=data_fetched_at,
            )
        )
    return summaries


async def refresh_project(
    project: Project,
    youtrack_token: str | None,
    youtrack_url: str | None,
    azuredevops_pat: str | None,
    azuredevops_url: str | None,
    db: AsyncSession,
) -> None:
    from app.models.db import ReleaseSource
    from app.services.youtrack_service import YouTrackService
    from app.services.azuredevops_service import AzureDevOpsService

    logger.info("refresh_project start project_id=%s source=%s", project.id, project.source)
    start = datetime.now(timezone.utc)

    try:
        releases: list[Release] = []
        if project.source == ReleaseSource.youtrack and youtrack_token and youtrack_url:
            svc = YouTrackService(base_url=youtrack_url, token=youtrack_token)
            releases = await svc.fetch_releases(project.youtrack_project_id or "")
        elif project.source == ReleaseSource.azuredevops and azuredevops_pat and azuredevops_url:
            svc = AzureDevOpsService(org_url=azuredevops_url, pat=azuredevops_pat)
            releases = await svc.fetch_releases(
                project.azuredevops_project or "",
                project.azuredevops_repository or "",
            )
        else:
            logger.info("refresh_project skip project_id=%s no credentials", project.id)
            return

        # Replace cached releases for this project
        await db.execute(
            CachedRelease.__table__.delete().where(  # type: ignore[attr-defined]
                CachedRelease.project_id == project.id
            )
        )
        for release in releases:
            db.add(
                CachedRelease(
                    project_id=project.id,
                    version=release.version,
                    release_date=release.release_date,
                    release_notes=release.release_notes,
                    naming_convention=release.naming_convention,
                    is_convention_match=release.is_convention_match,
                    fetched_at=datetime.now(timezone.utc),
                )
            )
        await db.commit()

        duration = (datetime.now(timezone.utc) - start).total_seconds()
        logger.info(
            "refresh_project done project_id=%s releases=%d duration_s=%.2f",
            project.id,
            len(releases),
            duration,
        )
    except Exception as exc:
        logger.error(
            "refresh_project failed project_id=%s error=%s",
            project.id,
            exc,
        )
        await db.rollback()


async def background_refresh_loop() -> None:
    logger.info("background_refresh_loop started ttl=%ds", settings.cache_ttl_seconds)
    while True:
        await asyncio.sleep(settings.cache_ttl_seconds)
        logger.info("background_refresh_loop cycle start")
        try:
            async with AsyncSessionFactory() as db:
                result = await db.execute(select(Project))
                projects = result.scalars().all()
                for project in projects:
                    # Background refresh cannot access per-user credentials.
                    # It can only refresh if credentials were previously cached.
                    # Without user credentials, we skip and serve stale cache.
                    await refresh_project(
                        project=project,
                        youtrack_token=None,
                        youtrack_url=None,
                        azuredevops_pat=None,
                        azuredevops_url=None,
                        db=db,
                    )
        except Exception as exc:
            logger.error("background_refresh_loop error=%s", exc)
        logger.info("background_refresh_loop cycle end")
