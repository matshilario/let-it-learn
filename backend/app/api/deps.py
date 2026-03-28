from __future__ import annotations

import uuid

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_token
from app.db.database import get_db
from app.models.teacher import Teacher


async def get_current_teacher(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> Teacher:
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header")
    token = authorization.removeprefix("Bearer ")
    payload = decode_token(token)
    sub = payload.get("sub")
    token_type = payload.get("type")
    if not sub or token_type != "access":
        raise UnauthorizedException("Invalid or expired token")
    try:
        teacher_id = uuid.UUID(sub)
    except ValueError:
        raise UnauthorizedException("Invalid token subject")
    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = result.scalar_one_or_none()
    if not teacher or not teacher.is_active:
        raise UnauthorizedException("Teacher not found or inactive")
    return teacher


async def get_current_user_optional(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Teacher | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ")
    payload = decode_token(token)
    sub = payload.get("sub")
    if not sub:
        return None
    try:
        teacher_id = uuid.UUID(sub)
    except ValueError:
        return None
    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    return result.scalar_one_or_none()
