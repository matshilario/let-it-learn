from __future__ import annotations

import uuid

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_modules: int = 0
    total_lessons: int = 0
    total_activities: int = 0
    total_sessions: int = 0
    total_students: int = 0
    total_responses: int = 0
    avg_score_percentage: float = 0.0
    recent_sessions: list[dict] = []


class QuestionAnalytics(BaseModel):
    question_id: uuid.UUID
    question_type: str
    total_responses: int = 0
    correct_count: int = 0
    incorrect_count: int = 0
    accuracy_rate: float = 0.0
    avg_time_seconds: float = 0.0


class SessionAnalytics(BaseModel):
    session_id: uuid.UUID
    activity_title: str = ""
    total_participants: int = 0
    avg_score: float = 0.0
    avg_time_seconds: float = 0.0
    completion_rate: float = 0.0
    questions: list[QuestionAnalytics] = []
