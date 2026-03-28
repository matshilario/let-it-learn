from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.student import StudentResponse


class ClassCreate(BaseModel):
    name: str
    institution_id: uuid.UUID | None = None


class ClassUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class ClassResponse(BaseModel):
    id: uuid.UUID
    teacher_id: uuid.UUID
    institution_id: uuid.UUID | None = None
    name: str
    join_code: str
    is_active: bool
    students: list[StudentResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
