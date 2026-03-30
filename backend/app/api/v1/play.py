from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, NotFoundException
from app.db.database import get_db
from app.domain.badges import evaluate_and_award
from app.domain.gamification import calculate_score, calculate_xp_gain, level_from_xp
from app.domain.grading import grade_response
from app.models.activity import Activity
from app.models.question import Question
from app.models.response import Response
from app.models.session import Session
from app.models.student import Student
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
    time_bonus: int = 0
    streak_multiplier: float = 1.0
    streak_count: int = 0
    xp_earned: int = 0


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

    # Fetch activity for gamification config
    activity_result = await db.execute(
        select(Activity).where(Activity.id == question.activity_id)
    )
    activity = activity_result.scalar_one_or_none()
    gamification = activity.gamification if activity else None

    is_correct, base_points = grade_response(question, body.answer)

    # Calculate current streak from previous responses in this session
    prev_responses = await db.execute(
        select(Response.is_correct)
        .where(Response.student_session_id == ss.id)
        .order_by(Response.answered_at.desc())
    )
    current_streak = 0
    for (prev_correct,) in prev_responses:
        if prev_correct:
            current_streak += 1
        else:
            break

    # Apply gamification scoring
    scoring = calculate_score(
        base_points=base_points,
        is_correct=is_correct,
        time_spent_seconds=body.time_spent_seconds,
        time_limit_seconds=question.time_limit_seconds or (activity.time_limit_seconds if activity else None),
        current_streak=current_streak,
        gamification=gamification,
    )

    # Calculate XP gain
    xp_earned = calculate_xp_gain(
        total_points=scoring.total_points,
        session_completed=False,
        gamification=gamification,
    )

    response = Response(
        student_session_id=ss.id,
        question_id=question.id,
        answer=body.answer,
        is_correct=is_correct,
        points_earned=scoring.total_points,
        time_spent_seconds=body.time_spent_seconds,
        answered_at=datetime.now(timezone.utc),
    )
    db.add(response)

    ss.score += scoring.total_points
    ss.max_score += question.points
    ss.time_spent_seconds += body.time_spent_seconds

    # Update student XP if authenticated
    if ss.student_id and xp_earned > 0:
        student_result = await db.execute(
            select(Student).where(Student.id == ss.student_id)
        )
        student = student_result.scalar_one_or_none()
        if student:
            student.total_xp += xp_earned
            student.level = level_from_xp(student.total_xp)

    await db.flush()

    return AnswerResponse(
        is_correct=is_correct,
        points_earned=scoring.total_points,
        explanation=question.explanation,
        time_bonus=scoring.time_bonus,
        streak_multiplier=scoring.streak_multiplier,
        streak_count=scoring.streak_count,
        xp_earned=xp_earned,
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

    # Award completion XP bonus and evaluate badges for authenticated students
    if ss.student_id:
        # Fetch activity for gamification config
        session_result = await db.execute(
            select(Session).where(Session.id == ss.session_id)
        )
        session_obj = session_result.scalar_one_or_none()
        gamification = None
        if session_obj:
            activity_result = await db.execute(
                select(Activity).where(Activity.id == session_obj.activity_id)
            )
            activity = activity_result.scalar_one_or_none()
            gamification = activity.gamification if activity else None

        # Completion XP bonus
        completion_xp = calculate_xp_gain(
            total_points=0,
            session_completed=True,
            gamification=gamification,
        )
        if completion_xp > 0:
            student_result = await db.execute(
                select(Student).where(Student.id == ss.student_id)
            )
            student = student_result.scalar_one_or_none()
            if student:
                student.total_xp += completion_xp
                student.level = level_from_xp(student.total_xp)

        # Calculate max streak for badge evaluation
        responses_result = await db.execute(
            select(Response.is_correct)
            .where(Response.student_session_id == ss.id)
            .order_by(Response.answered_at)
        )
        max_streak = 0
        current = 0
        for (is_correct,) in responses_result:
            if is_correct:
                current += 1
                max_streak = max(max_streak, current)
            else:
                current = 0

        # Evaluate badges
        await evaluate_and_award(
            db,
            ss.student_id,
            session_streak=max_streak,
            session_score=ss.score,
            session_max_score=ss.max_score,
        )

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
