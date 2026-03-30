from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.api.websocket.manager import manager
from app.core.security import decode_token
from app.db.database import async_session_factory
from app.domain.gamification import calculate_score, calculate_xp_gain, level_from_xp
from app.domain.grading import grade_response
from app.models.activity import Activity
from app.models.question import Question
from app.models.response import Response
from app.models.student import Student
from app.models.student_session import StudentSession

logger = logging.getLogger(__name__)

router = APIRouter()


async def _authenticate_ws(websocket: WebSocket) -> tuple[str, str]:
    """Return *(role, user_id)* after validating query params.

    Teachers must provide a valid JWT token.
    Students can connect without a JWT (open access); they must provide a
    ``student_session_id`` instead.
    """
    role = websocket.query_params.get("role", "student")
    token = websocket.query_params.get("token")
    student_session_id = websocket.query_params.get("student_session_id", "")

    if role == "teacher":
        if not token:
            await websocket.close(code=4001, reason="Missing token")
            raise WebSocketDisconnect(code=4001)
        payload = decode_token(token)
        sub = payload.get("sub")
        token_type = payload.get("type")
        if not sub or token_type != "access":
            await websocket.close(code=4002, reason="Invalid or expired token")
            raise WebSocketDisconnect(code=4002)
        return "teacher", sub

    # Student role — open access
    user_id = student_session_id or str(uuid.uuid4())
    return "student", user_id


@router.websocket("/ws/session/{session_id}")
async def websocket_session(websocket: WebSocket, session_id: str) -> None:
    """Main WebSocket endpoint for live session communication.

    Query params
    ------------
    role : ``teacher`` | ``student``
    token : JWT (required for teachers)
    student_session_id : UUID string (optional, identifies the student session)

    Client -> Server messages
    -------------------------
    * ``{"type": "answer", "question_id": "...", "answer": {...}, "time_spent_seconds": 0}``
    * ``{"type": "heartbeat"}``

    Server -> Client messages
    -------------------------
    * ``participant_joined``, ``participant_left``
    * ``question_changed``, ``session_started``, ``session_paused``, ``session_ended``
    * ``timer_sync``, ``answer_received``, ``leaderboard_update``
    * ``submissions_locked``, ``submissions_unlocked``
    """
    try:
        role, user_id = await _authenticate_ws(websocket)
    except WebSocketDisconnect:
        return

    await manager.connect(websocket, session_id, role, user_id)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "heartbeat":
                await websocket.send_json({"type": "heartbeat_ack"})

            elif msg_type == "answer" and role == "student":
                await _handle_answer(websocket, session_id, user_id, data)

            else:
                logger.debug("Unhandled WS message type: %s", msg_type)

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Unexpected error in WebSocket handler for session %s", session_id)
    finally:
        await manager.disconnect(websocket, session_id)


async def _handle_answer(
    websocket: WebSocket,
    session_id: str,
    student_session_id: str,
    data: dict,
) -> None:
    """Grade a student answer received over WebSocket and notify the teacher."""
    if manager.is_locked(session_id):
        await websocket.send_json({"type": "error", "message": "Submissions are locked"})
        return

    question_id_str = data.get("question_id")
    answer = data.get("answer")
    time_spent = data.get("time_spent_seconds", 0)

    if not question_id_str or answer is None:
        await websocket.send_json({"type": "error", "message": "Missing question_id or answer"})
        return

    try:
        question_id = uuid.UUID(question_id_str)
        ss_id = uuid.UUID(student_session_id)
    except ValueError:
        await websocket.send_json({"type": "error", "message": "Invalid UUID"})
        return

    async with async_session_factory() as db:
        try:
            # Fetch student session
            result = await db.execute(
                select(StudentSession).where(StudentSession.id == ss_id)
            )
            ss = result.scalar_one_or_none()
            if not ss:
                await websocket.send_json({"type": "error", "message": "Student session not found"})
                return

            # Fetch question
            q_result = await db.execute(select(Question).where(Question.id == question_id))
            question = q_result.scalar_one_or_none()
            if not question:
                await websocket.send_json({"type": "error", "message": "Question not found"})
                return

            # Check for duplicate answer
            existing = await db.execute(
                select(Response).where(
                    Response.student_session_id == ss.id,
                    Response.question_id == question.id,
                )
            )
            if existing.scalar_one_or_none():
                await websocket.send_json(
                    {"type": "error", "message": "Already answered this question"}
                )
                return

            # Fetch activity for gamification config
            activity_result = await db.execute(
                select(Activity).where(Activity.id == question.activity_id)
            )
            activity = activity_result.scalar_one_or_none()
            gamification = activity.gamification if activity else None

            # Grade
            is_correct, base_points = grade_response(question, answer)

            # Calculate current streak
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
                time_spent_seconds=time_spent,
                time_limit_seconds=question.time_limit_seconds or (activity.time_limit_seconds if activity else None),
                current_streak=current_streak,
                gamification=gamification,
            )

            # Calculate XP
            xp_earned = calculate_xp_gain(
                total_points=scoring.total_points,
                session_completed=False,
                gamification=gamification,
            )

            response = Response(
                student_session_id=ss.id,
                question_id=question.id,
                answer=answer,
                is_correct=is_correct,
                points_earned=scoring.total_points,
                time_spent_seconds=time_spent,
                answered_at=datetime.now(timezone.utc),
            )
            db.add(response)

            ss.score += scoring.total_points
            ss.max_score += question.points
            ss.time_spent_seconds += time_spent

            # Update student XP if authenticated
            if ss.student_id and xp_earned > 0:
                student_result = await db.execute(
                    select(Student).where(Student.id == ss.student_id)
                )
                student = student_result.scalar_one_or_none()
                if student:
                    student.total_xp += xp_earned
                    student.level = level_from_xp(student.total_xp)

            await db.commit()

            # Acknowledge to the student
            await websocket.send_json(
                {
                    "type": "answer_ack",
                    "question_id": str(question.id),
                    "is_correct": is_correct,
                    "points_earned": scoring.total_points,
                    "time_bonus": scoring.time_bonus,
                    "streak_multiplier": scoring.streak_multiplier,
                    "streak_count": scoring.streak_count,
                    "xp_earned": xp_earned,
                }
            )

            # Notify teacher
            await manager.send_to_teacher(
                session_id,
                {
                    "type": "answer_received",
                    "student_session_id": str(ss.id),
                    "question_id": str(question.id),
                    "is_correct": is_correct,
                    "nickname": ss.nickname,
                    "points_earned": scoring.total_points,
                },
            )

        except Exception:
            await db.rollback()
            logger.exception("Error processing answer")
            await websocket.send_json({"type": "error", "message": "Server error processing answer"})
