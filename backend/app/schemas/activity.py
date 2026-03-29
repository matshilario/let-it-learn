from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class ActivityCreate(BaseModel):
    title: str
    description: str | None = None
    activity_type: str
    access_mode: str = "open"
    is_published: bool = False
    sort_order: int = 0
    time_limit_seconds: int | None = None
    max_attempts: int | None = None
    shuffle_questions: bool = False
    shuffle_options: bool = False
    show_feedback: bool = True
    show_correct_answer: bool = False
    passing_score: int | None = None
    gamification: dict | None = None


class ActivityUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    activity_type: str | None = None
    access_mode: str | None = None
    is_published: bool | None = None
    sort_order: int | None = None
    time_limit_seconds: int | None = None
    max_attempts: int | None = None
    shuffle_questions: bool | None = None
    shuffle_options: bool | None = None
    show_feedback: bool | None = None
    show_correct_answer: bool | None = None
    passing_score: int | None = None
    gamification: dict | None = None


class ActivityResponse(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    teacher_id: uuid.UUID
    title: str
    description: str | None = None
    activity_type: str
    access_mode: str
    short_code: str
    sort_order: int
    is_published: bool
    version: int
    time_limit_seconds: int | None = None
    max_attempts: int | None = None
    shuffle_questions: bool
    shuffle_options: bool
    show_feedback: bool
    show_correct_answer: bool
    passing_score: int | None = None
    gamification: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
