"""Integration tests for API endpoints.
These tests MUST fail before the router implementations (T037).
"""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app


@pytest.mark.asyncio
async def test_get_projects_returns_200_with_list():
    """GET /api/projects returns 200 with a list of ProjectSummary."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch(
            "app.routers.projects.release_service.get_project_summaries",
            new_callable=AsyncMock,
            return_value=[],
        ):
            response = await client.get("/api/projects")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_projects_503_when_db_down():
    """GET /api/projects returns 503 when the database is unreachable."""
    from sqlalchemy.exc import OperationalError

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch(
            "app.routers.projects.release_service.get_project_summaries",
            side_effect=OperationalError("connection refused", None, None),
        ):
            response = await client.get("/api/projects")

    assert response.status_code == 503


@pytest.mark.asyncio
async def test_get_projects_includes_stale_flag():
    """ProjectSummary includes data_stale flag when cache is old."""
    from datetime import datetime, timezone, timedelta

    stale_project = {
        "id": "00000000-0000-0000-0000-000000000001",
        "slug": "test",
        "name": "Test",
        "source": "youtrack",
        "naming_convention": "semver",
        "release_cycle_days": 14,
        "current_version": "1.0.0",
        "last_release_date": None,
        "is_overdue": False,
        "days_since_release": None,
        "data_stale": True,
        "data_fetched_at": (
            datetime.now(timezone.utc) - timedelta(minutes=11)
        ).isoformat(),
    }

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch(
            "app.routers.projects.release_service.get_project_summaries",
            new_callable=AsyncMock,
            return_value=[stale_project],
        ):
            response = await client.get("/api/projects")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["data_stale"] is True
