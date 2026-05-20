"""Integration tests for AzureDevOpsService using respx mocks.
These tests MUST fail before the service is implemented (T034).
"""
import pytest
import respx
import httpx
from httpx import Response

from app.services.azuredevops_service import AzureDevOpsService
from app.models.errors import AuthenticationError, IntegrationUnavailableError


ORG_URL = "https://dev.azure.com/my-org"
PAT = "test-pat"
PROJECT = "MyProject"
REPO = "my-repo"


@pytest.fixture
def service():
    return AzureDevOpsService(org_url=ORG_URL, pat=PAT)


@pytest.mark.asyncio
@respx.mock
async def test_fetch_releases_happy_path(service):
    """Returns a list of Release objects on success."""
    respx.get(
        f"{ORG_URL}/{PROJECT}/_apis/release/releases",
    ).mock(
        return_value=Response(
            200,
            json={
                "value": [
                    {
                        "id": 1,
                        "name": "Release-1.2.3",
                        "createdOn": "2024-01-01T00:00:00Z",
                        "description": "Initial release",
                    }
                ],
                "count": 1,
            },
        )
    )

    releases = await service.fetch_releases(PROJECT, REPO)

    assert len(releases) == 1
    assert releases[0].version == "Release-1.2.3"


@pytest.mark.asyncio
@respx.mock
async def test_fetch_releases_401_raises_auth_error(service):
    """401 from Azure DevOps raises AuthenticationError."""
    respx.get(
        f"{ORG_URL}/{PROJECT}/_apis/release/releases",
    ).mock(return_value=Response(401, json={"message": "Unauthorized"}))

    with pytest.raises(AuthenticationError):
        await service.fetch_releases(PROJECT, REPO)


@pytest.mark.asyncio
async def test_fetch_releases_timeout_raises_unavailable(service):
    """Network timeout raises IntegrationUnavailableError."""
    with respx.mock:
        respx.get(
            f"{ORG_URL}/{PROJECT}/_apis/release/releases",
        ).mock(side_effect=httpx.TimeoutException("timeout"))

        with pytest.raises(IntegrationUnavailableError):
            await service.fetch_releases(PROJECT, REPO)
