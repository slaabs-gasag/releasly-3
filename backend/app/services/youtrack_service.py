import logging
from datetime import datetime, timezone

import httpx

from app.models.errors import AuthenticationError, IntegrationUnavailableError
from app.models.release import Release, detect_naming_convention

logger = logging.getLogger(__name__)


class YouTrackService:
    def __init__(self, base_url: str, token: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._token = token

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self._base_url,
            headers={"Authorization": f"Bearer {self._token}"},
            timeout=10.0,
        )

    async def fetch_releases(self, project_id: str) -> list[Release]:
        try:
            async with self._client() as client:
                response = await client.get(
                    f"/api/admin/projects/{project_id}/versions",
                    params={"fields": "id,name,releaseDate,description"},
                )
        except httpx.TimeoutException as exc:
            raise IntegrationUnavailableError(
                f"YouTrack timed out for project {project_id}"
            ) from exc
        except httpx.RequestError as exc:
            raise IntegrationUnavailableError(
                f"YouTrack unreachable: {exc}"
            ) from exc

        if response.status_code == 401:
            raise AuthenticationError("YouTrack token rejected")
        response.raise_for_status()

        releases = []
        for item in response.json():
            version = item.get("name", "")
            convention, is_match = detect_naming_convention(version)
            release_date = None
            raw_date = item.get("releaseDate")
            if raw_date:
                release_date = datetime.fromtimestamp(raw_date / 1000, tz=timezone.utc)
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
        self, project_id: str, version_id: str
    ) -> Release:
        try:
            async with self._client() as client:
                response = await client.get(
                    f"/api/admin/projects/{project_id}/versions/{version_id}",
                    params={"fields": "id,name,releaseDate,description"},
                )
        except httpx.TimeoutException as exc:
            raise IntegrationUnavailableError(
                f"YouTrack timed out fetching version detail"
            ) from exc

        if response.status_code == 401:
            raise AuthenticationError("YouTrack token rejected")
        response.raise_for_status()

        item = response.json()
        version = item.get("name", "")
        convention, is_match = detect_naming_convention(version)
        raw_date = item.get("releaseDate")
        release_date = (
            datetime.fromtimestamp(raw_date / 1000, tz=timezone.utc)
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
