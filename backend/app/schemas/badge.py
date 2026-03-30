from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class BadgeCreate(BaseModel):
    name: str
    description: str | None = None
    icon: str = "trophy"
    color: str = "gold"
    criteria_type: str
    criteria_value: int = 1
    xp_reward: int = 0
    is_global: bool = True
    sort_order: int = 0


class BadgeResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    icon: str
    color: str
    criteria_type: str
    criteria_value: int
    xp_reward: int
    is_global: bool
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentBadgeResponse(BaseModel):
    id: uuid.UUID
    badge: BadgeResponse
    earned_at: datetime
    context: dict | None = None

    model_config = {"from_attributes": True}


class StudentProfileResponse(BaseModel):
    id: uuid.UUID
    email: str | None = None
    full_name: str | None = None
    nickname: str | None = None
    avatar_url: str | None = None
    total_xp: int
    level: int
    xp_for_current_level: int
    xp_for_next_level: int
    badges: list[StudentBadgeResponse]
    sessions_completed: int
    total_score: int

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    student_id: uuid.UUID
    nickname: str | None = None
    full_name: str | None = None
    total_xp: int
    level: int
    badge_count: int
