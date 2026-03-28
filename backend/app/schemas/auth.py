from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class TeacherRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class TeacherLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TeacherResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: str | None = None
    locale: str = "pt-BR"
    timezone: str | None = None
    plan: str = "free"
    is_active: bool = True
    email_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TeacherUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    locale: str | None = None
    timezone: str | None = None
