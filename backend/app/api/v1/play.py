from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, NotFoundException
from app.db.database import get_db
from app.domain.grading import grade_response
from app.models.activity import Activity
from app.models.question import Question
from app.models.response import Response
from app.models.session import Session
from app.models.student_session import StudentSession
from app.schemas.session import SessionResponse, StudentSessionResponse

router = APIRouter()


class JoinRequest(BaseModel):
    join_code: str
    nickname: str | None = None
    student_id: uuid.UUID | None = None
    anonymous_id: str | None = None


class AnswerRequest(BaseModel):
    question_id: uuid.UUID
    answer: dict
    time_spent_seconds: int = 0


class AnswerResponse(BaseModel):
    is_correct: bool | None
    points_earned: int
    explanation: str | None = None


@router.get("/{short_code}", response_model=dict)
async def get_activity_for_play(
    short_code: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Activity).where(Activity.short_code == short_code))
    activity = result.scalar_one_or_none()
    if not activity:
        raise NotFoundException("Activity not found")
    return {
        "activity_id": str(activity.id),
        "title": activity.title,
        "description": activity.description,
        "activity_type": activity.activity_type,
        "time_limit_seconds": activity.time_limit_seconds,
        "shuffle_questions": activity.shuffle_questions,
        "shuffle_options": activity.shuffle_options,
        "show_feedback": activity.show_feedback,
        "total_questions": len(activity.questions) if activity.questions else 0,
    }


@router.post("/join", response_model=StudentSessionResponse)
async def join_session(
    body: JoinRequest,
    db: AsyncSession = Depends(get_db),
) -> StudentSessionResponse:
    result = await db.execute(
        select(Session).where(Session.join_code == body.join_code, Session.status != "ended")
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundException("Session not found or already ended")

    student_session = StudentSession(
        session_id=session.id,
        student_id=body.student_id,
        anonymous_id=body.anonymous_id,
        nickname=body.nickname,
        status="joined",
    )
    db.add(student_session)
    await db.flush()
    await db.refresh(student_session)
    return StudentSessionResponse.model_validate(student_session)


@router.post("/{session_id}/start", response_model=StudentSessionResponse)
async def start_student_session(
    session_id: uuid.UUID,
    student_session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> StudentSessionResponse:
    result = await db.execute(
        select(StudentSession).where(
            StudentSession.id == student_session_id,
            StudentSession.session_id == session_id,
        )
    )
    ss = result.scalar_one_or_none()
    if not ss:
        raise NotFoundException("Student session not found")
    ss.status = "in_progress"
    ss.started_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(ss)
    return StudentSessionResponse.model_validate(ss)


@router.post("/{session_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    session_id: uuid.UUID,
    body: AnswerRequest,
    student_session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AnswerResponse:
    result = await db.execute(
        select(StudentSession).where(
            StudentSession.id == student_session_id,
            StudentSession.session_id == session_id,
        )
    )
    ss = result.scalar_one_or_none()
    if not ss:
        raise NotFoundException("Student session not found")
    if ss.status not in ("joined", "in_progress"):
        raise BadRequestException("Session is not active for answering")

    q_result = await db.execute(select(Question).where(Question.id == body.question_id))
    question = q_result.scalar_one_or_none()
    if not question:
        raise NotFoundException("Question not found")

    is_correct, points_earned = grade_response(question, body.answer)

    response = Response(
        student_session_id=ss.id,
        question_id=question.id,
        answer=body.answer,
        is_correct=is_correct,
        points_earned=points_earned,
        time_spent_seconds=body.time_spent_seconds,
        answered_at=datetime.now(timezone.utc),
    )
    db.add(response)

    ss.score += points_earned
    ss.max_score += question.points
    ss.time_spent_seconds += body.time_spent_seconds

    await db.flush()

    return AnswerResponse(
        is_correct=is_correct,
        points_earned=points_earned,
        explanation=question.explanation,
    )


@router.post("/{session_id}/complete", response_model=StudentSessionResponse)
async def complete_student_session(
    session_id: uuid.UUID,
    student_session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> StudentSessionResponse:
    result = await db.execute(
        select(StudentSession).where(
            StudentSession.id == student_session_id,
            StudentSession.session_id == session_id,
        )
    )
    ss = result.scalar_one_or_none()
    if not ss:
        raise NotFoundException("Student session not found")
    ss.status = "completed"
    ss.completed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(ss)
    return StudentSessionResponse.model_validate(ss)


@router.get("/{session_id}/results", response_model=StudentSessionResponse)
async def get_student_results(
    session_id: uuid.UUID,
    student_session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> StudentSessionResponse:
    result = await db.execute(
        select(StudentSession).where(
            StudentSession.id == student_session_id,
            StudentSession.session_id == session_id,
        )
    )
    ss = result.scalar_one_or_none()
    if not ss:
        raise NotFoundException("Student session not found")
    return StudentSessionResponse.model_validate(ss)
