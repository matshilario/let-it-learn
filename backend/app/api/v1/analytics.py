from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_teacher
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.database import get_db
from app.models.activity import Activity
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.question import Question
from app.models.response import Response
from app.models.session import Session
from app.models.student_session import StudentSession
from app.models.teacher import Teacher
from app.schemas.analytics import DashboardStats, QuestionAnalytics, SessionAnalytics

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> DashboardStats:
    modules_count = (
        await db.execute(
            select(func.count()).select_from(Module).where(Module.teacher_id == teacher.id)
        )
    ).scalar() or 0

    lessons_count = (
        await db.execute(
            select(func.count()).select_from(Lesson).where(Lesson.teacher_id == teacher.id)
        )
    ).scalar() or 0

    activities_count = (
        await db.execute(
            select(func.count()).select_from(Activity).where(Activity.teacher_id == teacher.id)
        )
    ).scalar() or 0

    sessions_count = (
        await db.execute(
            select(func.count()).select_from(Session).where(Session.teacher_id == teacher.id)
        )
    ).scalar() or 0

    teacher_sessions_subq = select(Session.id).where(Session.teacher_id == teacher.id).subquery()
    students_count = (
        await db.execute(
            select(func.count(func.distinct(StudentSession.student_id)))
            .where(StudentSession.session_id.in_(select(teacher_sessions_subq)))
        )
    ).scalar() or 0

    responses_count = (
        await db.execute(
            select(func.count())
            .select_from(Response)
            .join(StudentSession, Response.student_session_id == StudentSession.id)
            .where(StudentSession.session_id.in_(select(teacher_sessions_subq)))
        )
    ).scalar() or 0

    avg_result = await db.execute(
        select(func.avg(StudentSession.score * 100.0 / func.nullif(StudentSession.max_score, 0)))
        .where(
            StudentSession.session_id.in_(select(teacher_sessions_subq)),
            StudentSession.max_score > 0,
        )
    )
    avg_score = avg_result.scalar() or 0.0

    recent_result = await db.execute(
        select(Session)
        .where(Session.teacher_id == teacher.id)
        .order_by(Session.created_at.desc())
        .limit(5)
    )
    recent = recent_result.scalars().all()
    recent_sessions = [
        {
            "id": str(s.id),
            "status": s.status,
            "session_type": s.session_type,
            "created_at": s.created_at.isoformat(),
        }
        for s in recent
    ]

    return DashboardStats(
        total_modules=modules_count,
        total_lessons=lessons_count,
        total_activities=activities_count,
        total_sessions=sessions_count,
        total_students=students_count,
        total_responses=responses_count,
        avg_score_percentage=round(float(avg_score), 2),
        recent_sessions=recent_sessions,
    )


@router.get("/sessions/{session_id}", response_model=SessionAnalytics)
async def get_session_analytics(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> SessionAnalytics:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundException("Session not found")
    if session.teacher_id != teacher.id:
        raise ForbiddenException("Not your session")

    activity_result = await db.execute(select(Activity).where(Activity.id == session.activity_id))
    activity = activity_result.scalar_one_or_none()
    activity_title = activity.title if activity else ""

    ss_result = await db.execute(
        select(StudentSession).where(StudentSession.session_id == session_id)
    )
    student_sessions = ss_result.scalars().all()
    total_participants = len(student_sessions)

    avg_score = 0.0
    avg_time = 0.0
    completed = 0
    if total_participants > 0:
        scores = [ss.score for ss in student_sessions]
        times = [ss.time_spent_seconds for ss in student_sessions]
        avg_score = sum(scores) / total_participants
        avg_time = sum(times) / total_participants
        completed = sum(1 for ss in student_sessions if ss.status == "completed")

    completion_rate = (completed / total_participants * 100) if total_participants > 0 else 0.0

    questions_result = await db.execute(
        select(Question).where(Question.activity_id == session.activity_id)
    )
    questions = questions_result.scalars().all()

    question_analytics = []
    for q in questions:
        resp_result = await db.execute(
            select(Response).where(
                Response.question_id == q.id,
                Response.student_session_id.in_([ss.id for ss in student_sessions]),
            )
        )
        responses = resp_result.scalars().all()
        total_resp = len(responses)
        correct = sum(1 for r in responses if r.is_correct)
        incorrect = total_resp - correct
        accuracy = (correct / total_resp * 100) if total_resp > 0 else 0.0
        avg_t = (sum(r.time_spent_seconds for r in responses) / total_resp) if total_resp > 0 else 0.0

        question_analytics.append(
            QuestionAnalytics(
                question_id=q.id,
                question_type=q.question_type,
                total_responses=total_resp,
                correct_count=correct,
                incorrect_count=incorrect,
                accuracy_rate=round(accuracy, 2),
                avg_time_seconds=round(avg_t, 2),
            )
        )

    return SessionAnalytics(
        session_id=session_id,
        activity_title=activity_title,
        total_participants=total_participants,
        avg_score=round(avg_score, 2),
        avg_time_seconds=round(avg_time, 2),
        completion_rate=round(completion_rate, 2),
        questions=question_analytics,
    )
