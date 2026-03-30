from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.badge import StudentBadge
    from app.models.student_session import StudentSession


class Student(Base):
    __tablename__ = "students"

    email: Mapped[str | None] = mapped_column(String(320), unique=True, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    oauth_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    total_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    student_sessions: Mapped[list[StudentSession]] = relationship(
        "StudentSession", back_populates="student"
    )
    student_badges: Mapped[list[StudentBadge]] = relationship(
        "StudentBadge", back_populates="student", cascade="all, delete-orphan"
    )
