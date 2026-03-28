from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.activity import Activity
    from app.models.question_option import QuestionOption
    from app.models.response import Response


class Question(Base):
    __tablename__ = "questions"

    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False
    )
    question_type: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    media_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    time_limit_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    activity: Mapped[Activity] = relationship("Activity", back_populates="questions", lazy="selectin")
    options: Mapped[list[QuestionOption]] = relationship(
        "QuestionOption", back_populates="question", lazy="selectin", cascade="all, delete-orphan"
    )
    responses: Mapped[list[Response]] = relationship("Response", back_populates="question", lazy="selectin")
