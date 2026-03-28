from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_teacher
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.db.database import get_db
from app.models.session import Session
from app.models.student_session import StudentSession
from app.models.teacher import Teacher
from app.schemas.common import PaginatedResponse
from app.schemas.session import SessionCreate, SessionResponse, StudentSessionResponse

router = APIRouter()


@router.post("/", response_model=SessionResponse, status_code=201)
async def create_session(
    body: SessionCreate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = Session(
        activity_id=body.activity_id,
        teacher_id=teacher.id,
        class_id=body.class_id,
        session_type=body.session_type,
        join_code=secrets.token_urlsafe(4)[:6].upper(),
        settings=body.settings,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.get("/", response_model=PaginatedResponse[SessionResponse])
async def list_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[SessionResponse]:
    base = select(Session).where(Session.teacher_id == teacher.id)
    total_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = total_result.scalar() or 0
    result = await db.execute(
        base.order_by(Session.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    sessions = result.scalars().all()
    return PaginatedResponse(
        items=[SessionResponse.model_validate(s) for s in sessions],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


async def _get_session(session_id: uuid.UUID, teacher: Teacher, db: AsyncSession) -> Session:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundException("Session not found")
    if session.teacher_id != teacher.id:
        raise ForbiddenException("Not your session")
    return session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await _get_session(session_id, teacher, db)
    return SessionResponse.model_validate(session)


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: uuid.UUID,
    status: str | None = None,
    current_question_id: uuid.UUID | None = None,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await _get_session(session_id, teacher, db)
    if status:
        session.status = status
        if status == "active" and not session.started_at:
            session.started_at = datetime.now(timezone.utc)
    if current_question_id:
        session.current_question_id = current_question_id
    await db.flush()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await _get_session(session_id, teacher, db)
    if session.status == "ended":
        raise BadRequestException("Session already ended")
    session.status = "ended"
    session.ended_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.get("/{session_id}/results", response_model=list[StudentSessionResponse])
async def get_session_results(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> list[StudentSessionResponse]:
    await _get_session(session_id, teacher, db)
    result = await db.execute(
        select(StudentSession)
        .where(StudentSession.session_id == session_id)
        .order_by(StudentSession.score.desc())
    )
    student_sessions = result.scalars().all()
    return [StudentSessionResponse.model_validate(ss) for ss in student_sessions]
