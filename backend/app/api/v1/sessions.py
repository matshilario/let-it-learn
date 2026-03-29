from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_teacher
from app.api.websocket.manager import manager
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.db.database import get_db
from app.domain.export.csv_exporter import export_session_csv
from app.models.question import Question
from app.models.response import Response
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


@router.get("/{session_id}/export/csv")
async def export_session_csv_endpoint(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    session = await _get_session(session_id, teacher, db)

    ss_result = await db.execute(
        select(StudentSession)
        .where(StudentSession.session_id == session_id)
        .order_by(StudentSession.score.desc())
    )
    student_sessions = ss_result.scalars().all()

    questions_result = await db.execute(
        select(Question)
        .where(Question.activity_id == session.activity_id)
        .order_by(Question.sort_order)
    )
    questions = questions_result.scalars().all()

    ss_ids = [ss.id for ss in student_sessions]
    responses_by_ss: dict[str, list[Response]] = {str(sid): [] for sid in ss_ids}
    if ss_ids:
        resp_result = await db.execute(
            select(Response).where(Response.student_session_id.in_(ss_ids))
        )
        for r in resp_result.scalars().all():
            responses_by_ss.setdefault(str(r.student_session_id), []).append(r)

    csv_content = export_session_csv(student_sessions, questions, responses_by_ss)

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=session_{session_id}.csv"
        },
    )


# ---------------------------------------------------------------------------
# Live session control endpoints
# ---------------------------------------------------------------------------


async def _get_ordered_questions(session: Session, db: AsyncSession) -> list[Question]:
    """Return the questions for this session's activity, ordered by sort_order."""
    result = await db.execute(
        select(Question)
        .where(Question.activity_id == session.activity_id)
        .order_by(Question.sort_order)
    )
    return list(result.scalars().all())


def _question_payload(question: Question, index: int) -> dict:
    """Build the payload sent to clients when the current question changes."""
    return {
        "type": "question_changed",
        "question_index": index,
        "question": {
            "id": str(question.id),
            "question_type": question.question_type,
            "content": question.content,
            "media_url": question.media_url,
            "hint": question.hint,
            "points": question.points,
            "time_limit_seconds": question.time_limit_seconds,
            "sort_order": question.sort_order,
            "options": [
                {
                    "id": str(o.id),
                    "content": o.content,
                    "media_url": getattr(o, "media_url", None),
                    "sort_order": o.sort_order,
                }
                for o in (question.options or [])
            ],
        },
    }


@router.post("/{session_id}/start-live", response_model=SessionResponse)
async def start_live_session(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Set status to active, set started_at, advance to first question, and
    broadcast ``session_started`` via WebSocket."""
    session = await _get_session(session_id, teacher, db)
    if session.status not in ("waiting", "paused"):
        raise BadRequestException("Session cannot be started from current state")

    questions = await _get_ordered_questions(session, db)
    if not questions:
        raise BadRequestException("Activity has no questions")

    session.status = "active"
    session.started_at = session.started_at or datetime.now(timezone.utc)
    session.current_question_id = questions[0].id
    await db.flush()
    await db.refresh(session)

    sid = str(session_id)
    await manager.broadcast_to_session(sid, {"type": "session_started"})
    await manager.broadcast_to_session(sid, _question_payload(questions[0], 0))

    return SessionResponse.model_validate(session)


@router.post("/{session_id}/next-question", response_model=SessionResponse)
async def next_question(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Advance to the next question and broadcast ``question_changed``."""
    session = await _get_session(session_id, teacher, db)
    if session.status != "active":
        raise BadRequestException("Session is not active")

    questions = await _get_ordered_questions(session, db)
    current_idx = _find_question_index(questions, session.current_question_id)
    next_idx = current_idx + 1
    if next_idx >= len(questions):
        raise BadRequestException("Already on the last question")

    session.current_question_id = questions[next_idx].id
    await db.flush()
    await db.refresh(session)

    await manager.broadcast_to_session(
        str(session_id), _question_payload(questions[next_idx], next_idx)
    )
    return SessionResponse.model_validate(session)


@router.post("/{session_id}/prev-question", response_model=SessionResponse)
async def prev_question(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Go back to the previous question and broadcast ``question_changed``."""
    session = await _get_session(session_id, teacher, db)
    if session.status != "active":
        raise BadRequestException("Session is not active")

    questions = await _get_ordered_questions(session, db)
    current_idx = _find_question_index(questions, session.current_question_id)
    prev_idx = current_idx - 1
    if prev_idx < 0:
        raise BadRequestException("Already on the first question")

    session.current_question_id = questions[prev_idx].id
    await db.flush()
    await db.refresh(session)

    await manager.broadcast_to_session(
        str(session_id), _question_payload(questions[prev_idx], prev_idx)
    )
    return SessionResponse.model_validate(session)


@router.post("/{session_id}/lock", response_model=dict)
async def lock_submissions(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Lock student submissions and broadcast ``submissions_locked``."""
    await _get_session(session_id, teacher, db)
    sid = str(session_id)
    manager.lock(sid)
    await manager.broadcast_to_session(sid, {"type": "submissions_locked"})
    return {"status": "locked"}


@router.post("/{session_id}/unlock", response_model=dict)
async def unlock_submissions(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Unlock student submissions and broadcast ``submissions_unlocked``."""
    await _get_session(session_id, teacher, db)
    sid = str(session_id)
    manager.unlock(sid)
    await manager.broadcast_to_session(sid, {"type": "submissions_unlocked"})
    return {"status": "unlocked"}


@router.get("/{session_id}/leaderboard", response_model=list[dict])
async def get_leaderboard(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Return the top students by score for this session."""
    await _get_session(session_id, teacher, db)
    result = await db.execute(
        select(StudentSession)
        .where(StudentSession.session_id == session_id)
        .order_by(StudentSession.score.desc())
        .limit(50)
    )
    student_sessions = result.scalars().all()
    return [
        {
            "student_session_id": str(ss.id),
            "nickname": ss.nickname,
            "score": ss.score,
            "max_score": ss.max_score,
            "time_spent_seconds": ss.time_spent_seconds,
        }
        for ss in student_sessions
    ]


def _find_question_index(questions: list[Question], question_id: uuid.UUID | None) -> int:
    """Return the index of the question with the given id, or 0 if not found."""
    if question_id is None:
        return 0
    for i, q in enumerate(questions):
        if q.id == question_id:
            return i
    return 0
