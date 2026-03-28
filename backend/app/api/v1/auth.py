from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_teacher
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db.database import get_db
from app.models.teacher import Teacher
from app.schemas.auth import TeacherLogin, TeacherRegister, TeacherResponse, TeacherUpdate, TokenResponse

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: TeacherRegister, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(Teacher).where(Teacher.email == body.email))
    if result.scalar_one_or_none():
        raise BadRequestException("Email already registered")
    teacher = Teacher(
        email=body.email,
        password_hash=get_password_hash(body.password),
        full_name=body.full_name,
    )
    db.add(teacher)
    await db.flush()
    access_token = create_access_token(str(teacher.id))
    refresh_token = create_refresh_token(str(teacher.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(body: TeacherLogin, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(Teacher).where(Teacher.email == body.email))
    teacher = result.scalar_one_or_none()
    if not teacher or not verify_password(body.password, teacher.password_hash):
        raise UnauthorizedException("Invalid email or password")
    if not teacher.is_active:
        raise UnauthorizedException("Account is deactivated")
    access_token = create_access_token(str(teacher.id))
    refresh_token = create_refresh_token(str(teacher.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    payload = decode_token(refresh_token)
    sub = payload.get("sub")
    token_type = payload.get("type")
    if not sub or token_type != "refresh":
        raise UnauthorizedException("Invalid refresh token")
    result = await db.execute(select(Teacher).where(Teacher.id == sub))
    teacher = result.scalar_one_or_none()
    if not teacher or not teacher.is_active:
        raise UnauthorizedException("Teacher not found or inactive")
    new_access = create_access_token(str(teacher.id))
    new_refresh = create_refresh_token(str(teacher.id))
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.get("/me", response_model=TeacherResponse)
async def get_me(teacher: Teacher = Depends(get_current_teacher)) -> TeacherResponse:
    return TeacherResponse.model_validate(teacher)


@router.put("/me", response_model=TeacherResponse)
async def update_me(
    body: TeacherUpdate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> TeacherResponse:
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(teacher, key, value)
    await db.flush()
    await db.refresh(teacher)
    return TeacherResponse.model_validate(teacher)
