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


# --- Phase 5 new schemas ---


class ModuleAnalytics(BaseModel):
    module_id: uuid.UUID
    module_title: str = ""
    total_lessons: int = 0
    total_activities: int = 0
    total_sessions: int = 0
    total_students: int = 0
    avg_score_percentage: float = 0.0
    completion_rate: float = 0.0
    performance_trend: list[float] = []


class ScoreBucket(BaseModel):
    label: str
    count: int = 0


class QuestionDifficulty(BaseModel):
    question_id: uuid.UUID
    question_type: str
    correct_pct: float = 0.0
    avg_time_seconds: float = 0.0


class ActivityAnalytics(BaseModel):
    activity_id: uuid.UUID
    activity_title: str = ""
    total_sessions: int = 0
    total_attempts: int = 0
    score_distribution: list[ScoreBucket] = []
    question_difficulty: list[QuestionDifficulty] = []
    avg_time_per_question: float = 0.0


class StudentAnalytics(BaseModel):
    student_id: uuid.UUID
    nickname: str | None = None
    total_sessions: int = 0
    avg_score: float = 0.0
    score_trend: list[dict] = []
    strengths: list[dict] = []
    weaknesses: list[dict] = []


class WeekDataPoint(BaseModel):
    week: str
    value: float = 0.0


class EngagementMetrics(BaseModel):
    sessions_per_week: list[WeekDataPoint] = []
    active_students_per_week: list[WeekDataPoint] = []
    avg_completion_rate_per_week: list[WeekDataPoint] = []
    avg_time_per_week: list[WeekDataPoint] = []
