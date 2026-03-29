from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.activity import Activity
    from app.models.teacher import Teacher
    from app.models.class_ import Class
    from app.models.student_session import StudentSession


class Session(Base):
    __tablename__ = "sessions"

    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False
    )
    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False
    )
    class_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True
    )
    session_type: Mapped[str] = mapped_column(String(32), nullable=False, default="live")
    join_code: Mapped[str | None] = mapped_column(String(16), unique=True, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="waiting")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_question_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id"), nullable=True
    )
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    activity: Mapped[Activity] = relationship("Activity", back_populates="sessions")
    teacher: Mapped[Teacher] = relationship("Teacher", back_populates="sessions")
    class_: Mapped[Class | None] = relationship("Class", back_populates="sessions")
    student_sessions: Mapped[list[StudentSession]] = relationship(
        "StudentSession", back_populates="session", cascade="all, delete-orphan"
    )
