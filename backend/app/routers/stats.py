import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db import CachedRelease, Project
from app.models.release import ReleaseStats

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stats", response_model=list[ReleaseStats])
async def get_stats(days: int = 90, db: AsyncSession = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    projects_result = await db.execute(select(Project))
    projects = projects_result.scalars().all()

    stats = []
    for project in projects:
        releases_result = await db.execute(
            select(CachedRelease)
            .where(
                CachedRelease.project_id == project.id,
                CachedRelease.release_date >= cutoff,
            )
            .order_by(CachedRelease.release_date.asc())
        )
        releases = releases_result.scalars().all()

        weekly_counts: dict[str, int] = defaultdict(int)
        dates = []
        for r in releases:
            if r.release_date:
                dt = r.release_date.replace(tzinfo=timezone.utc) if r.release_date.tzinfo is None else r.release_date
                week_key = dt.strftime("%Y-W%W")
                weekly_counts[week_key] += 1
                dates.append(dt)

        total_weeks = max(days / 7, 1)
        releases_per_week = len(releases) / total_weeks

        avg_cycle = 0.0
        if len(dates) >= 2:
            gaps = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]
            avg_cycle = sum(gaps) / len(gaps)

        on_track = avg_cycle <= project.release_cycle_days if avg_cycle > 0 else True

        stats.append(
            ReleaseStats(
                project_id=str(project.id),
                project_name=project.name,
                releases_per_week=round(releases_per_week, 2),
                average_cycle_days=round(avg_cycle, 1),
                configured_cycle_days=project.release_cycle_days,
                on_track=on_track,
                weekly_counts=[
                    {"week": k, "count": v}
                    for k, v in sorted(weekly_counts.items())
                ],
            )
        )

    return stats


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(select(1))
        return {"status": "ok", "database": "connected"}
    except Exception:
        from fastapi import Response
        return Response(
            content='{"status":"degraded","database":"unreachable"}',
            status_code=503,
            media_type="application/json",
        )
