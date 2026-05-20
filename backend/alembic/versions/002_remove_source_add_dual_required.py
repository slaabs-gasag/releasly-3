"""Remove source column; make three integration fields NOT NULL

Revision ID: 002
Revises: 001
Create Date: 2026-05-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Backfill NULLs before enforcing NOT NULL
    op.execute("UPDATE projects SET youtrack_project_id = '' WHERE youtrack_project_id IS NULL")
    op.execute("UPDATE projects SET azuredevops_project = '' WHERE azuredevops_project IS NULL")
    op.execute("UPDATE projects SET azuredevops_repository = '' WHERE azuredevops_repository IS NULL")

    op.alter_column("projects", "youtrack_project_id", nullable=False)
    op.alter_column("projects", "azuredevops_project", nullable=False)
    op.alter_column("projects", "azuredevops_repository", nullable=False)

    op.drop_column("projects", "source")
    op.execute("DROP TYPE IF EXISTS releasesource")


def downgrade() -> None:
    op.execute("CREATE TYPE releasesource AS ENUM ('youtrack', 'azuredevops')")
    op.add_column(
        "projects",
        sa.Column(
            "source",
            sa.Enum("youtrack", "azuredevops", name="releasesource"),
            nullable=True,
        ),
    )
    op.execute("UPDATE projects SET source = 'youtrack'")
    op.alter_column("projects", "source", nullable=False)

    op.alter_column("projects", "youtrack_project_id", nullable=True)
    op.alter_column("projects", "azuredevops_project", nullable=True)
    op.alter_column("projects", "azuredevops_repository", nullable=True)
