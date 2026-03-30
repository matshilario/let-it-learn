"""Badge criteria evaluation.

Each ``Badge.criteria_type`` maps to an evaluator function that receives a
context dict and the ``criteria_value`` threshold.  When the condition is met
the badge is awarded to the student.

Supported criteria types
------------------------
- ``first_activity``     — completed at least *N* activities (default 1)
- ``perfect_score``      — achieved 100 % in *N* sessions
- ``streak_N``           — reached a streak of *N* consecutive correct answers in a session
- ``speed_demon``        — answered *N* questions under 5 seconds each
- ``xp_milestone``       — accumulated at least *N* total XP
- ``sessions_completed`` — completed at least *N* sessions total
- ``score_above_90``     — scored >= 90 % in *N* sessions
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.badge import Badge, StudentBadge
from app.models.response import Response
from app.models.student import Student
from app.models.student_session import StudentSession


async def evaluate_and_award(
    db: AsyncSession,
    student_id: uuid.UUID,
    *,
    session_streak: int = 0,
    session_score: int = 0,
    session_max_score: int = 0,
) -> list[Badge]:
    """Check all badge criteria for a student and award any newly earned badges.

    Returns the list of *newly* awarded ``Badge`` objects (may be empty).
    """
    # Fetch badges the student does NOT have yet
    already = (
        select(StudentBadge.badge_id).where(StudentBadge.student_id == student_id)
    )
    result = await db.execute(
        select(Badge).where(Badge.id.notin_(already))
    )
    candidates = list(result.scalars().all())

    if not candidates:
        return []

    # Gather stats lazily — only query what we need
    stats: dict[str, object] = {
        "session_streak": session_streak,
        "session_score": session_score,
        "session_max_score": session_max_score,
    }
    awarded: list[Badge] = []

    for badge in candidates:
        met = await _check_criteria(db, student_id, badge, stats)
        if met:
            sb = StudentBadge(
                student_id=student_id,
                badge_id=badge.id,
                earned_at=datetime.now(timezone.utc),
                context={
                    "criteria_type": badge.criteria_type,
                    "criteria_value": badge.criteria_value,
                },
            )
            db.add(sb)

            # Award XP bonus from badge
            if badge.xp_reward > 0:
                student_result = await db.execute(
                    select(Student).where(Student.id == student_id)
                )
                student = student_result.scalar_one_or_none()
                if student:
                    student.total_xp += badge.xp_reward

            awarded.append(badge)

    return awarded


async def _check_criteria(
    db: AsyncSession,
    student_id: uuid.UUID,
    badge: Badge,
    stats: dict[str, object],
) -> bool:
    ct = badge.criteria_type
    cv = badge.criteria_value

    if ct == "first_activity":
        return await _count_completed_sessions(db, student_id) >= cv

    if ct == "perfect_score":
        return await _count_perfect_sessions(db, student_id) >= cv

    if ct.startswith("streak_"):
        return int(stats.get("session_streak", 0)) >= cv

    if ct == "speed_demon":
        return await _count_fast_answers(db, student_id) >= cv

    if ct == "xp_milestone":
        result = await db.execute(select(Student.total_xp).where(Student.id == student_id))
        xp = result.scalar_one_or_none() or 0
        return xp >= cv

    if ct == "sessions_completed":
        return await _count_completed_sessions(db, student_id) >= cv

    if ct == "score_above_90":
        return await _count_high_score_sessions(db, student_id, threshold=90) >= cv

    return False


async def _count_completed_sessions(db: AsyncSession, student_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(StudentSession)
        .where(
            StudentSession.student_id == student_id,
            StudentSession.status == "completed",
        )
    )
    return result.scalar_one()


async def _count_perfect_sessions(db: AsyncSession, student_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(StudentSession)
        .where(
            StudentSession.student_id == student_id,
            StudentSession.status == "completed",
            StudentSession.max_score > 0,
            StudentSession.score == StudentSession.max_score,
        )
    )
    return result.scalar_one()


async def _count_fast_answers(db: AsyncSession, student_id: uuid.UUID) -> int:
    """Count responses answered in under 5 seconds."""
    result = await db.execute(
        select(func.count())
        .select_from(Response)
        .join(StudentSession, Response.student_session_id == StudentSession.id)
        .where(
            StudentSession.student_id == student_id,
            Response.is_correct == True,  # noqa: E712
            Response.time_spent_seconds < 5,
        )
    )
    return result.scalar_one()


async def _count_high_score_sessions(
    db: AsyncSession, student_id: uuid.UUID, *, threshold: int = 90
) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(StudentSession)
        .where(
            StudentSession.student_id == student_id,
            StudentSession.status == "completed",
            StudentSession.max_score > 0,
            (StudentSession.score * 100 / StudentSession.max_score) >= threshold,
        )
    )
    return result.scalar_one()
