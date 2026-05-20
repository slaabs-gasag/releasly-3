import re
from datetime import datetime

from pydantic import BaseModel

from app.models.db import NamingConvention

SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")
DATE_RE = re.compile(r"^\d{8}\.\d+$")


def detect_naming_convention(version: str) -> tuple[NamingConvention, bool]:
    if SEMVER_RE.match(version):
        return NamingConvention.semver, True
    if DATE_RE.match(version):
        return NamingConvention.date, True
    return NamingConvention.unknown, False


class Release(BaseModel):
    version: str
    release_date: datetime | None = None
    release_notes: str | None = None
    naming_convention: NamingConvention = NamingConvention.unknown
    is_convention_match: bool = False
    source: str = "live"


class ReleaseStats(BaseModel):
    project_id: str
    project_name: str
    releases_per_week: float
    average_cycle_days: float
    configured_cycle_days: int
    on_track: bool
    weekly_counts: list[dict]
