from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.institution import Institution
    from app.models.module import Module
    from app.models.lesson import Lesson
    from app.models.activity import Activity
    from app.models.class_ import Class
    from app.models.session import Session


class Teacher(Base):
    __tablename__ = "teachers"

    institution_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("institutions.id"), nullable=True
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    locale: Mapped[str] = mapped_column(String(10), nullable=False, default="pt-BR")
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    plan: Mapped[str] = mapped_column(String(32), nullable=False, default="free")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    oauth_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    institution: Mapped[Institution | None] = relationship("Institution", back_populates="teachers")
    modules: Mapped[list[Module]] = relationship("Module", back_populates="teacher")
    lessons: Mapped[list[Lesson]] = relationship("Lesson", back_populates="teacher")
    activities: Mapped[list[Activity]] = relationship("Activity", back_populates="teacher")
    classes: Mapped[list[Class]] = relationship("Class", back_populates="teacher")
    sessions: Mapped[list[Session]] = relationship("Session", back_populates="teacher")
