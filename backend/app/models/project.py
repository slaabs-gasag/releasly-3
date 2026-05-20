import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, computed_field

from app.models.db import NamingConvention, ReleaseSource


class ProjectCreate(BaseModel):
    name: str
    source: ReleaseSource
    youtrack_project_id: str | None = None
    azuredevops_project: str | None = None
    azuredevops_repository: str | None = None
    naming_convention: NamingConvention = NamingConvention.semver
    release_cycle_days: int = 14


class ProjectUpdate(BaseModel):
    name: str | None = None
    source: ReleaseSource | None = None
    youtrack_project_id: str | None = None
    azuredevops_project: str | None = None
    azuredevops_repository: str | None = None
    naming_convention: NamingConvention | None = None
    release_cycle_days: int | None = None


class ProjectSummary(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    source: ReleaseSource
    naming_convention: NamingConvention
    release_cycle_days: int
    current_version: str | None = None
    last_release_date: datetime | None = None
    is_overdue: bool = False
    days_since_release: int | None = None
    data_stale: bool = False
    data_fetched_at: datetime | None = None

    model_config = {"from_attributes": True}
