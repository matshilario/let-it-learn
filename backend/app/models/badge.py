from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.student import Student


class Badge(Base):
    __tablename__ = "badges"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(64), nullable=False, default="trophy")
    color: Mapped[str] = mapped_column(String(32), nullable=False, default="gold")
    criteria_type: Mapped[str] = mapped_column(String(64), nullable=False)
    criteria_value: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_global: Mapped[bool] = mapped_column(default=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    student_badges: Mapped[list[StudentBadge]] = relationship(
        "StudentBadge", back_populates="badge", cascade="all, delete-orphan"
    )


class StudentBadge(Base):
    __tablename__ = "student_badges"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )
    badge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False
    )
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    student: Mapped[Student] = relationship("Student", back_populates="student_badges")
    badge: Mapped[Badge] = relationship("Badge", back_populates="student_badges")
