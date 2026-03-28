from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class QuestionOptionCreate(BaseModel):
    content: str
    media_url: str | None = None
    is_correct: bool = False
    sort_order: int = 0
    category_id: str | None = None
    match_target_id: str | None = None
    metadata: dict | None = None


class QuestionOptionResponse(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    content: str
    media_url: str | None = None
    is_correct: bool
    sort_order: int
    category_id: str | None = None
    match_target_id: str | None = None
    metadata: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    question_type: str
    content: dict
    media_url: str | None = None
    hint: str | None = None
    explanation: str | None = None
    points: int = 10
    time_limit_seconds: int | None = None
    sort_order: int = 0
    config: dict | None = None
    options: list[QuestionOptionCreate] | None = None


class QuestionUpdate(BaseModel):
    question_type: str | None = None
    content: dict | None = None
    media_url: str | None = None
    hint: str | None = None
    explanation: str | None = None
    points: int | None = None
    time_limit_seconds: int | None = None
    sort_order: int | None = None
    config: dict | None = None
    options: list[QuestionOptionCreate] | None = None


class QuestionResponse(BaseModel):
    id: uuid.UUID
    activity_id: uuid.UUID
    question_type: str
    content: dict
    media_url: str | None = None
    hint: str | None = None
    explanation: str | None = None
    points: int
    time_limit_seconds: int | None = None
    sort_order: int
    config: dict | None = None
    options: list[QuestionOptionResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
