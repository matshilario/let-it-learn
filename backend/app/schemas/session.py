from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class SessionCreate(BaseModel):
    activity_id: uuid.UUID
    class_id: uuid.UUID | None = None
    session_type: str = "live"
    settings: dict | None = None


class SessionResponse(BaseModel):
    id: uuid.UUID
    activity_id: uuid.UUID
    teacher_id: uuid.UUID
    class_id: uuid.UUID | None = None
    session_type: str
    join_code: str | None = None
    status: str
    started_at: datetime | None = None
    ended_at: datetime | None = None
    current_question_id: uuid.UUID | None = None
    settings: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StudentSessionResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    student_id: uuid.UUID | None = None
    anonymous_id: str | None = None
    nickname: str | None = None
    score: int
    max_score: int
    time_spent_seconds: int
    status: str
    attempt_number: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
