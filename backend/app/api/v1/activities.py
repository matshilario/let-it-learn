from __future__ import annotations

import io
import secrets
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_teacher, get_current_user_optional
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.database import get_db
from app.models.activity import Activity
from app.models.lesson import Lesson
from app.models.teacher import Teacher
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate
from app.schemas.common import MessageResponse

router = APIRouter()


def _generate_short_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()


async def _verify_lesson_ownership(lesson_id: uuid.UUID, teacher: Teacher, db: AsyncSession) -> Lesson:
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise NotFoundException("Lesson not found")
    if lesson.teacher_id != teacher.id:
        raise ForbiddenException("Not your lesson")
    return lesson


@router.get("/lessons/{lesson_id}/activities", response_model=list[ActivityResponse])
async def list_activities(
    lesson_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> list[ActivityResponse]:
    await _verify_lesson_ownership(lesson_id, teacher, db)
    result = await db.execute(
        select(Activity)
        .where(Activity.lesson_id == lesson_id)
        .order_by(Activity.sort_order, Activity.created_at)
    )
    activities = result.scalars().all()
    return [ActivityResponse.model_validate(a) for a in activities]


@router.post("/lessons/{lesson_id}/activities", response_model=ActivityResponse, status_code=201)
async def create_activity(
    lesson_id: uuid.UUID,
    body: ActivityCreate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ActivityResponse:
    await _verify_lesson_ownership(lesson_id, teacher, db)
    activity = Activity(
        lesson_id=lesson_id,
        teacher_id=teacher.id,
        short_code=_generate_short_code(),
        **body.model_dump(),
    )
    db.add(activity)
    await db.flush()
    await db.refresh(activity)
    return ActivityResponse.model_validate(activity)


async def _get_activity(activity_id: uuid.UUID, teacher: Teacher, db: AsyncSession) -> Activity:
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise NotFoundException("Activity not found")
    if activity.teacher_id != teacher.id:
        raise ForbiddenException("Not your activity")
    return activity


@router.get("/activities/by-code/{code}", response_model=ActivityResponse)
async def get_activity_by_code(
    code: str,
    teacher: Teacher | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> ActivityResponse:
    result = await db.execute(select(Activity).where(Activity.short_code == code))
    activity = result.scalar_one_or_none()
    if not activity:
        raise NotFoundException("Activity not found")
    return ActivityResponse.model_validate(activity)


@router.get("/activities/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ActivityResponse:
    activity = await _get_activity(activity_id, teacher, db)
    return ActivityResponse.model_validate(activity)


@router.put("/activities/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: uuid.UUID,
    body: ActivityUpdate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ActivityResponse:
    activity = await _get_activity(activity_id, teacher, db)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(activity, key, value)
    await db.flush()
    await db.refresh(activity)
    return ActivityResponse.model_validate(activity)


@router.delete("/activities/{activity_id}", response_model=MessageResponse)
async def delete_activity(
    activity_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    activity = await _get_activity(activity_id, teacher, db)
    await db.delete(activity)
    await db.flush()
    return MessageResponse(message="Activity deleted")


@router.get("/activities/{activity_id}/qrcode")
async def get_activity_qrcode(
    activity_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    import qrcode as qr_lib

    activity = await _get_activity(activity_id, teacher, db)
    qr = qr_lib.QRCode(version=1, box_size=10, border=4)
    qr.add_data(activity.short_code)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")
