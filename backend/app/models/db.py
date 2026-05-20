import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class NamingConvention(str, PyEnum):
    semver = "semver"
    date = "date"
    unknown = "unknown"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    youtrack_project_id: Mapped[str] = mapped_column(String(200), nullable=False)
    azuredevops_project: Mapped[str] = mapped_column(String(200), nullable=False)
    azuredevops_repository: Mapped[str] = mapped_column(String(200), nullable=False)
    naming_convention: Mapped[NamingConvention] = mapped_column(
        SAEnum(NamingConvention), nullable=False, default=NamingConvention.semver
    )
    release_cycle_days: Mapped[int] = mapped_column(Integer, nullable=False, default=14)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    cached_releases: Mapped[list["CachedRelease"]] = relationship(
        "CachedRelease", back_populates="project", cascade="all, delete-orphan"
    )


class CachedRelease(Base):
    __tablename__ = "cached_releases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[str] = mapped_column(String(100), nullable=False)
    release_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    release_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    naming_convention: Mapped[NamingConvention] = mapped_column(
        SAEnum(NamingConvention), nullable=False, default=NamingConvention.unknown
    )
    is_convention_match: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project: Mapped[Project] = relationship("Project", back_populates="cached_releases")
