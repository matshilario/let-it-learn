from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_teacher
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.database import get_db
from app.models.activity import Activity
from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.teacher import Teacher
from app.schemas.common import MessageResponse
from app.schemas.question import QuestionCreate, QuestionResponse, QuestionUpdate

router = APIRouter()


async def _verify_activity_ownership(activity_id: uuid.UUID, teacher: Teacher, db: AsyncSession) -> Activity:
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise NotFoundException("Activity not found")
    if activity.teacher_id != teacher.id:
        raise ForbiddenException("Not your activity")
    return activity


@router.get("/activities/{activity_id}/questions", response_model=list[QuestionResponse])
async def list_questions(
    activity_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> list[QuestionResponse]:
    await _verify_activity_ownership(activity_id, teacher, db)
    result = await db.execute(
        select(Question)
        .where(Question.activity_id == activity_id)
        .order_by(Question.sort_order, Question.created_at)
    )
    questions = result.scalars().all()
    return [QuestionResponse.model_validate(q) for q in questions]


@router.post("/activities/{activity_id}/questions", response_model=QuestionResponse, status_code=201)
async def create_question(
    activity_id: uuid.UUID,
    body: QuestionCreate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> QuestionResponse:
    await _verify_activity_ownership(activity_id, teacher, db)
    data = body.model_dump(exclude={"options"})
    question = Question(activity_id=activity_id, **data)
    db.add(question)
    await db.flush()

    if body.options:
        for opt_data in body.options:
            option = QuestionOption(
                question_id=question.id,
                content=opt_data.content,
                media_url=opt_data.media_url,
                is_correct=opt_data.is_correct,
                sort_order=opt_data.sort_order,
                category_id=opt_data.category_id,
                match_target_id=opt_data.match_target_id,
                metadata_=opt_data.metadata,
            )
            db.add(option)
        await db.flush()

    await db.refresh(question)
    return QuestionResponse.model_validate(question)


async def _get_question(question_id: uuid.UUID, teacher: Teacher, db: AsyncSession) -> Question:
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundException("Question not found")
    await _verify_activity_ownership(question.activity_id, teacher, db)
    return question


@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: uuid.UUID,
    body: QuestionUpdate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> QuestionResponse:
    question = await _get_question(question_id, teacher, db)
    update_data = body.model_dump(exclude_unset=True, exclude={"options"})
    for key, value in update_data.items():
        setattr(question, key, value)

    if body.options is not None:
        # Delete existing options and recreate
        for opt in list(question.options):
            await db.delete(opt)
        await db.flush()

        for opt_data in body.options:
            option = QuestionOption(
                question_id=question.id,
                content=opt_data.content,
                media_url=opt_data.media_url,
                is_correct=opt_data.is_correct,
                sort_order=opt_data.sort_order,
                category_id=opt_data.category_id,
                match_target_id=opt_data.match_target_id,
                metadata_=opt_data.metadata,
            )
            db.add(option)

    await db.flush()
    await db.refresh(question)
    return QuestionResponse.model_validate(question)


@router.delete("/questions/{question_id}", response_model=MessageResponse)
async def delete_question(
    question_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    question = await _get_question(question_id, teacher, db)
    await db.delete(question)
    await db.flush()
    return MessageResponse(message="Question deleted")
