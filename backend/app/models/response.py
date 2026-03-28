from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.student_session import StudentSession
    from app.models.question import Question


class Response(Base):
    __tablename__ = "responses"

    student_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("student_sessions.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    answer: Mapped[dict] = mapped_column(JSONB, nullable=False)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    points_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    student_session: Mapped[StudentSession] = relationship("StudentSession", back_populates="responses", lazy="selectin")
    question: Mapped[Question] = relationship("Question", back_populates="responses", lazy="selectin")
