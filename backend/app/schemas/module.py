from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class ModuleCreate(BaseModel):
    title: str
    description: str | None = None
    cover_image_url: str | None = None
    is_published: bool = False
    sort_order: int = 0
    settings: dict | None = None


class ModuleUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    cover_image_url: str | None = None
    is_published: bool | None = None
    sort_order: int | None = None
    settings: dict | None = None


class ModuleResponse(BaseModel):
    id: uuid.UUID
    teacher_id: uuid.UUID
    title: str
    description: str | None = None
    cover_image_url: str | None = None
    is_published: bool
    sort_order: int
    settings: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
