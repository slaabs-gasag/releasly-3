import base64
import logging
from datetime import datetime, timezone

import httpx

from app.models.errors import AuthenticationError, IntegrationUnavailableError
from app.models.release import Release, detect_naming_convention

logger = logging.getLogger(__name__)

API_VERSION = "7.1"


class AzureDevOpsService:
    def __init__(self, org_url: str, pat: str) -> None:
        self._org_url = org_url.rstrip("/")
        credentials = base64.b64encode(f":{pat}".encode()).decode()
        self._auth_header = f"Basic {credentials}"

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            headers={"Authorization": self._auth_header},
            timeout=10.0,
        )

    async def fetch_releases(self, project: str, repository: str) -> list[Release]:
        url = f"{self._org_url}/{project}/_apis/release/releases"
        try:
            async with self._client() as client:
                response = await client.get(
                    url,
                    params={"api-version": API_VERSION, "$top": 100},
                )
        except httpx.TimeoutException as exc:
            raise IntegrationUnavailableError(
                f"Azure DevOps timed out for {project}"
            ) from exc
        except httpx.RequestError as exc:
            raise IntegrationUnavailableError(
                f"Azure DevOps unreachable: {exc}"
            ) from exc

        if response.status_code == 401:
            raise AuthenticationError("Azure DevOps PAT rejected")
        response.raise_for_status()

        data = response.json()
        releases = []
        for item in data.get("value", []):
            version = item.get("name", "")
            convention, is_match = detect_naming_convention(version)
            raw_date = item.get("createdOn")
            release_date = (
                datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                if raw_date
                else None
            )
            releases.append(
                Release(
                    version=version,
                    release_date=release_date,
                    release_notes=item.get("description"),
                    naming_convention=convention,
                    is_convention_match=is_match,
                )
            )
        return releases

    async def fetch_release_detail(
        self, project: str, repo: str, release_id: int
    ) -> Release:
        url = f"{self._org_url}/{project}/_apis/release/releases/{release_id}"
        try:
            async with self._client() as client:
                response = await client.get(
                    url, params={"api-version": API_VERSION}
                )
        except httpx.TimeoutException as exc:
            raise IntegrationUnavailableError(
                "Azure DevOps timed out fetching release detail"
            ) from exc

        if response.status_code == 401:
            raise AuthenticationError("Azure DevOps PAT rejected")
        response.raise_for_status()

        item = response.json()
        version = item.get("name", "")
        convention, is_match = detect_naming_convention(version)
        raw_date = item.get("createdOn")
        release_date = (
            datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
            if raw_date
            else None
        )
        return Release(
            version=version,
            release_date=release_date,
            release_notes=item.get("description"),
            naming_convention=convention,
            is_convention_match=is_match,
        )
