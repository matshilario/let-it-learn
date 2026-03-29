from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections per session."""

    def __init__(self) -> None:
        # session_id -> list of (websocket, role, user_id)
        self.active_connections: dict[str, list[tuple[WebSocket, str, str]]] = {}
        # session_id -> set of locked flags
        self._locked_sessions: set[str] = set()

    async def connect(
        self, websocket: WebSocket, session_id: str, role: str, user_id: str
    ) -> None:
        """Accept a WebSocket and register it in the session's connection list.

        *role* is ``'teacher'`` or ``'student'``.
        """
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append((websocket, role, user_id))

        # Broadcast participant_joined to everyone in the session
        await self.broadcast_to_session(
            session_id,
            {
                "type": "participant_joined",
                "count": self.get_participant_count(session_id),
                "role": role,
                "user_id": user_id,
            },
        )

    async def disconnect(self, websocket: WebSocket, session_id: str) -> None:
        """Remove a connection and notify remaining participants."""
        conns = self.active_connections.get(session_id, [])
        self.active_connections[session_id] = [
            (ws, r, uid) for ws, r, uid in conns if ws is not websocket
        ]
        # Clean up empty session lists
        if not self.active_connections[session_id]:
            del self.active_connections[session_id]
            self._locked_sessions.discard(session_id)

        await self.broadcast_to_session(
            session_id,
            {
                "type": "participant_left",
                "count": self.get_participant_count(session_id),
            },
        )

    async def broadcast_to_session(self, session_id: str, message: dict[str, Any]) -> None:
        """Send *message* to every connection in the session."""
        conns = self.active_connections.get(session_id, [])
        if not conns:
            return
        tasks = [self._safe_send(ws, message) for ws, _r, _uid in conns]
        await asyncio.gather(*tasks)

    async def send_to_teacher(self, session_id: str, message: dict[str, Any]) -> None:
        """Send *message* only to teacher connections in the session."""
        conns = self.active_connections.get(session_id, [])
        tasks = [self._safe_send(ws, message) for ws, r, _uid in conns if r == "teacher"]
        if tasks:
            await asyncio.gather(*tasks)

    async def send_to_students(self, session_id: str, message: dict[str, Any]) -> None:
        """Send *message* only to student connections in the session."""
        conns = self.active_connections.get(session_id, [])
        tasks = [self._safe_send(ws, message) for ws, r, _uid in conns if r == "student"]
        if tasks:
            await asyncio.gather(*tasks)

    def get_participant_count(self, session_id: str) -> int:
        """Return the number of active **student** connections."""
        conns = self.active_connections.get(session_id, [])
        return sum(1 for _ws, r, _uid in conns if r == "student")

    def is_locked(self, session_id: str) -> bool:
        return session_id in self._locked_sessions

    def lock(self, session_id: str) -> None:
        self._locked_sessions.add(session_id)

    def unlock(self, session_id: str) -> None:
        self._locked_sessions.discard(session_id)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    async def _safe_send(websocket: WebSocket, message: dict[str, Any]) -> None:
        """Send JSON to a single websocket, swallowing errors on stale connections."""
        try:
            await websocket.send_json(message)
        except Exception:
            logger.debug("Failed to send message to a WebSocket client", exc_info=True)


# Singleton instance used across the application
manager = ConnectionManager()
