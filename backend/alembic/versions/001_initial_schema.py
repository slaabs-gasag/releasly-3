"""Initial schema: projects and cached_releases tables

Revision ID: 001
Revises:
Create Date: 2026-05-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column(
            "source",
            sa.Enum("youtrack", "azuredevops", name="releasesource"),
            nullable=False,
        ),
        sa.Column("youtrack_project_id", sa.String(200), nullable=True),
        sa.Column("azuredevops_project", sa.String(200), nullable=True),
        sa.Column("azuredevops_repository", sa.String(200), nullable=True),
        sa.Column(
            "naming_convention",
            sa.Enum("semver", "date", "unknown", name="namingconvention"),
            nullable=False,
            server_default="semver",
        ),
        sa.Column("release_cycle_days", sa.Integer(), nullable=False, server_default="14"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_projects_slug", "projects", ["slug"])

    op.create_table(
        "cached_releases",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version", sa.String(100), nullable=False),
        sa.Column("release_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("release_notes", sa.Text(), nullable=True),
        sa.Column(
            "naming_convention",
            sa.Enum("semver", "date", "unknown", name="namingconvention"),
            nullable=False,
            server_default="unknown",
        ),
        sa.Column("is_convention_match", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "fetched_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["project_id"], ["projects.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cached_releases_project_id", "cached_releases", ["project_id"])


def downgrade() -> None:
    op.drop_index("ix_cached_releases_project_id", table_name="cached_releases")
    op.drop_table("cached_releases")
    op.drop_index("ix_projects_slug", table_name="projects")
    op.drop_table("projects")
    op.execute("DROP TYPE IF EXISTS releasesource")
    op.execute("DROP TYPE IF EXISTS namingconvention")
