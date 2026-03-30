from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_teacher
from app.core.exceptions import NotFoundException
from app.db.database import get_db
from app.domain.gamification import level_from_xp, xp_for_level
from app.models.badge import Badge, StudentBadge
from app.models.student import Student
from app.models.student_session import StudentSession
from app.schemas.badge import (
    BadgeCreate,
    BadgeResponse,
    LeaderboardEntry,
    StudentBadgeResponse,
    StudentProfileResponse,
)

router = APIRouter()


# ---- Badge CRUD (teacher-managed) ----


@router.get("/badges", response_model=list[BadgeResponse])
async def list_badges(
    db: AsyncSession = Depends(get_db),
) -> list[BadgeResponse]:
    result = await db.execute(select(Badge).order_by(Badge.sort_order))
    return [BadgeResponse.model_validate(b) for b in result.scalars().all()]


@router.post("/badges", response_model=BadgeResponse)
async def create_badge(
    body: BadgeCreate,
    teacher: object = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> BadgeResponse:
    badge = Badge(**body.model_dump())
    db.add(badge)
    await db.flush()
    await db.refresh(badge)
    return BadgeResponse.model_validate(badge)


@router.delete("/badges/{badge_id}", status_code=204)
async def delete_badge(
    badge_id: uuid.UUID,
    teacher: object = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Badge).where(Badge.id == badge_id))
    badge = result.scalar_one_or_none()
    if not badge:
        raise NotFoundException("Badge not found")
    await db.delete(badge)
    await db.flush()


# ---- Student profile ----


@router.get("/students/{student_id}/profile", response_model=StudentProfileResponse)
async def get_student_profile(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> StudentProfileResponse:
    result = await db.execute(
        select(Student)
        .options(selectinload(Student.student_badges).selectinload(StudentBadge.badge))
        .where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundException("Student not found")

    # Calculate XP progress
    current_level_xp = xp_for_level(student.level)
    next_level_xp = xp_for_level(student.level + 1)

    # Count completed sessions and total score
    stats_result = await db.execute(
        select(
            func.count().label("sessions_completed"),
            func.coalesce(func.sum(StudentSession.score), 0).label("total_score"),
        )
        .select_from(StudentSession)
        .where(
            StudentSession.student_id == student_id,
            StudentSession.status == "completed",
        )
    )
    stats = stats_result.one()

    badges = [
        StudentBadgeResponse(
            id=sb.id,
            badge=BadgeResponse.model_validate(sb.badge),
            earned_at=sb.earned_at,
            context=sb.context,
        )
        for sb in student.student_badges
    ]

    return StudentProfileResponse(
        id=student.id,
        email=student.email,
        full_name=student.full_name,
        nickname=student.nickname,
        avatar_url=student.avatar_url,
        total_xp=student.total_xp,
        level=student.level,
        xp_for_current_level=current_level_xp,
        xp_for_next_level=next_level_xp,
        badges=badges,
        sessions_completed=stats.sessions_completed,
        total_score=stats.total_score,
    )


# ---- XP Leaderboard ----


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_xp_leaderboard(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
) -> list[LeaderboardEntry]:
    badge_count_subq = (
        select(StudentBadge.student_id, func.count().label("badge_count"))
        .group_by(StudentBadge.student_id)
        .subquery()
    )

    result = await db.execute(
        select(
            Student.id,
            Student.nickname,
            Student.full_name,
            Student.total_xp,
            Student.level,
            func.coalesce(badge_count_subq.c.badge_count, 0).label("badge_count"),
        )
        .outerjoin(badge_count_subq, Student.id == badge_count_subq.c.student_id)
        .order_by(Student.total_xp.desc())
        .limit(limit)
    )

    return [
        LeaderboardEntry(
            student_id=row.id,
            nickname=row.nickname,
            full_name=row.full_name,
            total_xp=row.total_xp,
            level=row.level,
            badge_count=row.badge_count,
        )
        for row in result.all()
    ]


# ---- Seed default badges ----


@router.post("/badges/seed-defaults", response_model=list[BadgeResponse])
async def seed_default_badges(
    teacher: object = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> list[BadgeResponse]:
    """Create a standard set of badges if none exist."""
    existing = await db.execute(select(func.count()).select_from(Badge))
    if existing.scalar_one() > 0:
        result = await db.execute(select(Badge).order_by(Badge.sort_order))
        return [BadgeResponse.model_validate(b) for b in result.scalars().all()]

    defaults = [
        Badge(name="Primeira Atividade", description="Completou sua primeira atividade", icon="rocket", color="blue", criteria_type="first_activity", criteria_value=1, xp_reward=25, sort_order=1),
        Badge(name="Nota Perfeita", description="100% de acerto em uma sessao", icon="star", color="gold", criteria_type="perfect_score", criteria_value=1, xp_reward=50, sort_order=2),
        Badge(name="Sequencia de 5", description="5 respostas corretas seguidas", icon="flame", color="orange", criteria_type="streak_5", criteria_value=5, xp_reward=30, sort_order=3),
        Badge(name="Sequencia de 10", description="10 respostas corretas seguidas", icon="zap", color="yellow", criteria_type="streak_10", criteria_value=10, xp_reward=75, sort_order=4),
        Badge(name="Velocista", description="20 respostas corretas em menos de 5 segundos", icon="timer", color="green", criteria_type="speed_demon", criteria_value=20, xp_reward=40, sort_order=5),
        Badge(name="Veterano", description="Completou 10 atividades", icon="award", color="purple", criteria_type="sessions_completed", criteria_value=10, xp_reward=60, sort_order=6),
        Badge(name="Mestre", description="Completou 50 atividades", icon="crown", color="gold", criteria_type="sessions_completed", criteria_value=50, xp_reward=150, sort_order=7),
        Badge(name="Excelencia", description="Nota acima de 90% em 5 sessoes", icon="medal", color="silver", criteria_type="score_above_90", criteria_value=5, xp_reward=80, sort_order=8),
        Badge(name="XP 1000", description="Acumulou 1000 XP", icon="gem", color="emerald", criteria_type="xp_milestone", criteria_value=1000, xp_reward=100, sort_order=9),
        Badge(name="XP 5000", description="Acumulou 5000 XP", icon="diamond", color="cyan", criteria_type="xp_milestone", criteria_value=5000, xp_reward=250, sort_order=10),
    ]
    for badge in defaults:
        db.add(badge)
    await db.flush()

    result = await db.execute(select(Badge).order_by(Badge.sort_order))
    return [BadgeResponse.model_validate(b) for b in result.scalars().all()]
