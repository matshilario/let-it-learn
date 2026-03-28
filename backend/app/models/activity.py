from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.teacher import Teacher
    from app.models.lesson import Lesson
    from app.models.question import Question
    from app.models.session import Session


class Activity(Base):
    __tablename__ = "activities"

    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    activity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    access_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="public")
    short_code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    time_limit_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    shuffle_questions: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    shuffle_options: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    show_feedback: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_correct_answer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    passing_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gamification: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    lesson: Mapped[Lesson] = relationship("Lesson", back_populates="activities", lazy="selectin")
    teacher: Mapped[Teacher] = relationship("Teacher", back_populates="activities", lazy="selectin")
    questions: Mapped[list[Question]] = relationship(
        "Question", back_populates="activity", lazy="selectin", cascade="all, delete-orphan"
    )
    sessions: Mapped[list[Session]] = relationship("Session", back_populates="activity", lazy="selectin")
