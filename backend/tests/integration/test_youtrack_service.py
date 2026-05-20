"""Integration tests for YouTrackService using respx mocks.
These tests MUST fail before the service is implemented (T033).
"""
import pytest
import respx
import httpx
from httpx import Response

from app.services.youtrack_service import YouTrackService
from app.models.errors import AuthenticationError, IntegrationUnavailableError


BASE_URL = "https://youtrack.example.com"
TOKEN = "perm:test-token"
PROJECT_ID = "TEST"


@pytest.fixture
def service():
    return YouTrackService(base_url=BASE_URL, token=TOKEN)


@pytest.mark.asyncio
@respx.mock
async def test_fetch_releases_happy_path(service):
    """Returns a list of Release objects on success."""
    respx.get(f"{BASE_URL}/api/admin/projects/{PROJECT_ID}/versions").mock(
        return_value=Response(
            200,
            json=[
                {
                    "id": "1",
                    "name": "1.2.3",
                    "releaseDate": 1700000000000,
                    "description": "First release",
                }
            ],
        )
    )

    releases = await service.fetch_releases(PROJECT_ID)

    assert len(releases) == 1
    assert releases[0].version == "1.2.3"


@pytest.mark.asyncio
@respx.mock
async def test_fetch_releases_401_raises_auth_error(service):
    """401 from YouTrack raises AuthenticationError."""
    respx.get(f"{BASE_URL}/api/admin/projects/{PROJECT_ID}/versions").mock(
        return_value=Response(401, json={"error": "Unauthorized"})
    )

    with pytest.raises(AuthenticationError):
        await service.fetch_releases(PROJECT_ID)


@pytest.mark.asyncio
async def test_fetch_releases_timeout_raises_unavailable(service):
    """Network timeout raises IntegrationUnavailableError."""
    with respx.mock:
        respx.get(f"{BASE_URL}/api/admin/projects/{PROJECT_ID}/versions").mock(
            side_effect=httpx.TimeoutException("timeout")
        )

        with pytest.raises(IntegrationUnavailableError):
            await service.fetch_releases(PROJECT_ID)
