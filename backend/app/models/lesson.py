from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.teacher import Teacher
    from app.models.module import Module
    from app.models.activity import Activity


class Lesson(Base):
    __tablename__ = "lessons"

    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    module: Mapped[Module] = relationship("Module", back_populates="lessons", lazy="selectin")
    teacher: Mapped[Teacher] = relationship("Teacher", back_populates="lessons", lazy="selectin")
    activities: Mapped[list[Activity]] = relationship(
        "Activity", back_populates="lesson", lazy="selectin", cascade="all, delete-orphan"
    )
