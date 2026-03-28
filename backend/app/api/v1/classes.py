from __future__ import annotations

import secrets
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_teacher
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.database import get_db
from app.models.class_ import Class, class_students
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.class_ import ClassCreate, ClassResponse, ClassUpdate
from app.schemas.common import MessageResponse

router = APIRouter()


@router.get("/", response_model=list[ClassResponse])
async def list_classes(
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> list[ClassResponse]:
    result = await db.execute(
        select(Class)
        .where(Class.teacher_id == teacher.id)
        .order_by(Class.created_at.desc())
    )
    classes = result.scalars().all()
    return [ClassResponse.model_validate(c) for c in classes]


@router.post("/", response_model=ClassResponse, status_code=201)
async def create_class(
    body: ClassCreate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ClassResponse:
    cls = Class(
        teacher_id=teacher.id,
        institution_id=body.institution_id,
        name=body.name,
        join_code=secrets.token_urlsafe(4)[:6].upper(),
    )
    db.add(cls)
    await db.flush()
    await db.refresh(cls)
    return ClassResponse.model_validate(cls)


async def _get_class(class_id: uuid.UUID, teacher: Teacher, db: AsyncSession) -> Class:
    result = await db.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    if not cls:
        raise NotFoundException("Class not found")
    if cls.teacher_id != teacher.id:
        raise ForbiddenException("Not your class")
    return cls


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ClassResponse:
    cls = await _get_class(class_id, teacher, db)
    return ClassResponse.model_validate(cls)


@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: uuid.UUID,
    body: ClassUpdate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ClassResponse:
    cls = await _get_class(class_id, teacher, db)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(cls, key, value)
    await db.flush()
    await db.refresh(cls)
    return ClassResponse.model_validate(cls)


@router.delete("/{class_id}", response_model=MessageResponse)
async def delete_class(
    class_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    cls = await _get_class(class_id, teacher, db)
    await db.delete(cls)
    await db.flush()
    return MessageResponse(message="Class deleted")


class AddStudentRequest(BaseModel):
    student_id: uuid.UUID


@router.post("/{class_id}/students", response_model=MessageResponse)
async def add_student_to_class(
    class_id: uuid.UUID,
    body: AddStudentRequest,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    cls = await _get_class(class_id, teacher, db)
    result = await db.execute(select(Student).where(Student.id == body.student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundException("Student not found")
    await db.execute(class_students.insert().values(class_id=cls.id, student_id=student.id))
    await db.flush()
    return MessageResponse(message="Student added to class")


@router.delete("/{class_id}/students/{student_id}", response_model=MessageResponse)
async def remove_student_from_class(
    class_id: uuid.UUID,
    student_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await _get_class(class_id, teacher, db)
    await db.execute(
        class_students.delete().where(
            class_students.c.class_id == class_id,
            class_students.c.student_id == student_id,
        )
    )
    await db.flush()
    return MessageResponse(message="Student removed from class")
