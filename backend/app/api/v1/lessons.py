from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_teacher
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.database import get_db
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.teacher import Teacher
from app.schemas.common import MessageResponse
from app.schemas.lesson import LessonCreate, LessonResponse, LessonUpdate

router = APIRouter()


async def _verify_module_ownership(module_id: uuid.UUID, teacher: Teacher, db: AsyncSession) -> Module:
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise NotFoundException("Module not found")
    if module.teacher_id != teacher.id:
        raise ForbiddenException("Not your module")
    return module


@router.get("/modules/{module_id}/lessons", response_model=list[LessonResponse])
async def list_lessons(
    module_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> list[LessonResponse]:
    await _verify_module_ownership(module_id, teacher, db)
    result = await db.execute(
        select(Lesson)
        .where(Lesson.module_id == module_id)
        .order_by(Lesson.sort_order, Lesson.created_at)
    )
    lessons = result.scalars().all()
    return [LessonResponse.model_validate(l) for l in lessons]


@router.post("/modules/{module_id}/lessons", response_model=LessonResponse, status_code=201)
async def create_lesson(
    module_id: uuid.UUID,
    body: LessonCreate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> LessonResponse:
    await _verify_module_ownership(module_id, teacher, db)
    lesson = Lesson(module_id=module_id, teacher_id=teacher.id, **body.model_dump())
    db.add(lesson)
    await db.flush()
    await db.refresh(lesson)
    return LessonResponse.model_validate(lesson)


async def _get_lesson(lesson_id: uuid.UUID, teacher: Teacher, db: AsyncSession) -> Lesson:
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise NotFoundException("Lesson not found")
    if lesson.teacher_id != teacher.id:
        raise ForbiddenException("Not your lesson")
    return lesson


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> LessonResponse:
    lesson = await _get_lesson(lesson_id, teacher, db)
    return LessonResponse.model_validate(lesson)


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: uuid.UUID,
    body: LessonUpdate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> LessonResponse:
    lesson = await _get_lesson(lesson_id, teacher, db)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(lesson, key, value)
    await db.flush()
    await db.refresh(lesson)
    return LessonResponse.model_validate(lesson)


@router.delete("/lessons/{lesson_id}", response_model=MessageResponse)
async def delete_lesson(
    lesson_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    lesson = await _get_lesson(lesson_id, teacher, db)
    await db.delete(lesson)
    await db.flush()
    return MessageResponse(message="Lesson deleted")
