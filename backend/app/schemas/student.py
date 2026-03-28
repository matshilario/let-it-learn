from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class StudentRegister(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    nickname: str | None = None


class StudentLogin(BaseModel):
    email: EmailStr
    password: str


class StudentResponse(BaseModel):
    id: uuid.UUID
    email: str | None = None
    full_name: str | None = None
    nickname: str | None = None
    avatar_url: str | None = None
    total_xp: int
    level: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
