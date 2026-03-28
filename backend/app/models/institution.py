from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.teacher import Teacher
    from app.models.class_ import Class


class Institution(Base):
    __tablename__ = "institutions"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    teachers: Mapped[list[Teacher]] = relationship("Teacher", back_populates="institution", lazy="selectin")
    classes: Mapped[list[Class]] = relationship("Class", back_populates="institution", lazy="selectin")
