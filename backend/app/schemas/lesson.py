from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class LessonCreate(BaseModel):
    title: str
    description: str | None = None
    sort_order: int = 0
    is_published: bool = False


class LessonUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    sort_order: int | None = None
    is_published: bool | None = None


class LessonResponse(BaseModel):
    id: uuid.UUID
    module_id: uuid.UUID
    teacher_id: uuid.UUID
    title: str
    description: str | None = None
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
