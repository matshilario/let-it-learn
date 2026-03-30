"""Add badges and student_badges tables

Revision ID: 001_badges
Revises:
Create Date: 2026-03-30
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "001_badges"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "badges",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(64), nullable=False, server_default="trophy"),
        sa.Column("color", sa.String(32), nullable=False, server_default="gold"),
        sa.Column("criteria_type", sa.String(64), nullable=False),
        sa.Column("criteria_value", sa.Integer, nullable=False, server_default="1"),
        sa.Column("xp_reward", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_global", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "student_badges",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False),
        sa.Column("badge_id", UUID(as_uuid=True), sa.ForeignKey("badges.id", ondelete="CASCADE"), nullable=False),
        sa.Column("earned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("context", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index("ix_student_badges_student_id", "student_badges", ["student_id"])
    op.create_index("ix_student_badges_badge_id", "student_badges", ["badge_id"])


def downgrade() -> None:
    op.drop_table("student_badges")
    op.drop_table("badges")
