from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_teacher
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.database import get_db
from app.models.activity import Activity
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.question import Question
from app.models.response import Response
from app.models.session import Session
from app.models.student_session import StudentSession
from app.models.teacher import Teacher
from app.schemas.analytics import (
    ActivityAnalytics,
    DashboardStats,
    EngagementMetrics,
    ModuleAnalytics,
    QuestionAnalytics,
    QuestionDifficulty,
    ScoreBucket,
    SessionAnalytics,
    StudentAnalytics,
    WeekDataPoint,
)

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> DashboardStats:
    modules_count = (
        await db.execute(
            select(func.count()).select_from(Module).where(Module.teacher_id == teacher.id)
        )
    ).scalar() or 0

    lessons_count = (
        await db.execute(
            select(func.count()).select_from(Lesson).where(Lesson.teacher_id == teacher.id)
        )
    ).scalar() or 0

    activities_count = (
        await db.execute(
            select(func.count()).select_from(Activity).where(Activity.teacher_id == teacher.id)
        )
    ).scalar() or 0

    sessions_count = (
        await db.execute(
            select(func.count()).select_from(Session).where(Session.teacher_id == teacher.id)
        )
    ).scalar() or 0

    teacher_sessions_subq = select(Session.id).where(Session.teacher_id == teacher.id).subquery()
    students_count = (
        await db.execute(
            select(func.count(func.distinct(StudentSession.student_id)))
            .where(StudentSession.session_id.in_(select(teacher_sessions_subq)))
        )
    ).scalar() or 0

    responses_count = (
        await db.execute(
            select(func.count())
            .select_from(Response)
            .join(StudentSession, Response.student_session_id == StudentSession.id)
            .where(StudentSession.session_id.in_(select(teacher_sessions_subq)))
        )
    ).scalar() or 0

    avg_result = await db.execute(
        select(func.avg(StudentSession.score * 100.0 / func.nullif(StudentSession.max_score, 0)))
        .where(
            StudentSession.session_id.in_(select(teacher_sessions_subq)),
            StudentSession.max_score > 0,
        )
    )
    avg_score = avg_result.scalar() or 0.0

    recent_result = await db.execute(
        select(Session)
        .where(Session.teacher_id == teacher.id)
        .order_by(Session.created_at.desc())
        .limit(5)
    )
    recent = recent_result.scalars().all()
    recent_sessions = [
        {
            "id": str(s.id),
            "status": s.status,
            "session_type": s.session_type,
            "created_at": s.created_at.isoformat(),
        }
        for s in recent
    ]

    return DashboardStats(
        total_modules=modules_count,
        total_lessons=lessons_count,
        total_activities=activities_count,
        total_sessions=sessions_count,
        total_students=students_count,
        total_responses=responses_count,
        avg_score_percentage=round(float(avg_score), 2),
        recent_sessions=recent_sessions,
    )


@router.get("/sessions/{session_id}", response_model=SessionAnalytics)
async def get_session_analytics(
    session_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> SessionAnalytics:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundException("Session not found")
    if session.teacher_id != teacher.id:
        raise ForbiddenException("Not your session")

    activity_result = await db.execute(select(Activity).where(Activity.id == session.activity_id))
    activity = activity_result.scalar_one_or_none()
    activity_title = activity.title if activity else ""

    ss_result = await db.execute(
        select(StudentSession).where(StudentSession.session_id == session_id)
    )
    student_sessions = ss_result.scalars().all()
    total_participants = len(student_sessions)

    avg_score = 0.0
    avg_time = 0.0
    completed = 0
    if total_participants > 0:
        scores = [ss.score for ss in student_sessions]
        times = [ss.time_spent_seconds for ss in student_sessions]
        avg_score = sum(scores) / total_participants
        avg_time = sum(times) / total_participants
        completed = sum(1 for ss in student_sessions if ss.status == "completed")

    completion_rate = (completed / total_participants * 100) if total_participants > 0 else 0.0

    questions_result = await db.execute(
        select(Question).where(Question.activity_id == session.activity_id)
    )
    questions = questions_result.scalars().all()

    question_analytics = []
    for q in questions:
        resp_result = await db.execute(
            select(Response).where(
                Response.question_id == q.id,
                Response.student_session_id.in_([ss.id for ss in student_sessions]),
            )
        )
        responses = resp_result.scalars().all()
        total_resp = len(responses)
        correct = sum(1 for r in responses if r.is_correct)
        incorrect = total_resp - correct
        accuracy = (correct / total_resp * 100) if total_resp > 0 else 0.0
        avg_t = (sum(r.time_spent_seconds for r in responses) / total_resp) if total_resp > 0 else 0.0

        question_analytics.append(
            QuestionAnalytics(
                question_id=q.id,
                question_type=q.question_type,
                total_responses=total_resp,
                correct_count=correct,
                incorrect_count=incorrect,
                accuracy_rate=round(accuracy, 2),
                avg_time_seconds=round(avg_t, 2),
            )
        )

    return SessionAnalytics(
        session_id=session_id,
        activity_title=activity_title,
        total_participants=total_participants,
        avg_score=round(avg_score, 2),
        avg_time_seconds=round(avg_time, 2),
        completion_rate=round(completion_rate, 2),
        questions=question_analytics,
    )


# ---------------------------------------------------------------------------
# Phase 5 – New analytics endpoints
# ---------------------------------------------------------------------------


@router.get("/modules/{module_id}", response_model=ModuleAnalytics)
async def get_module_analytics(
    module_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ModuleAnalytics:
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise NotFoundException("Module not found")
    if module.teacher_id != teacher.id:
        raise ForbiddenException("Not your module")

    # Lessons in this module
    lessons_result = await db.execute(
        select(Lesson).where(Lesson.module_id == module_id)
    )
    lessons = lessons_result.scalars().all()
    lesson_ids = [l.id for l in lessons]

    # Activities in those lessons
    activities_result = await db.execute(
        select(Activity).where(Activity.lesson_id.in_(lesson_ids))
    ) if lesson_ids else None
    activities = activities_result.scalars().all() if activities_result else []
    activity_ids = [a.id for a in activities]

    # Sessions for those activities
    sessions_result = await db.execute(
        select(Session).where(Session.activity_id.in_(activity_ids))
    ) if activity_ids else None
    sessions = sessions_result.scalars().all() if sessions_result else []
    session_ids = [s.id for s in sessions]

    # Students
    students_count = 0
    if session_ids:
        students_count = (
            await db.execute(
                select(func.count(func.distinct(StudentSession.student_id)))
                .where(StudentSession.session_id.in_(session_ids))
            )
        ).scalar() or 0

    # Avg score
    avg_score = 0.0
    completion_rate = 0.0
    if session_ids:
        avg_res = await db.execute(
            select(func.avg(StudentSession.score * 100.0 / func.nullif(StudentSession.max_score, 0)))
            .where(
                StudentSession.session_id.in_(session_ids),
                StudentSession.max_score > 0,
            )
        )
        avg_score = float(avg_res.scalar() or 0.0)

        total_ss = (
            await db.execute(
                select(func.count()).select_from(StudentSession)
                .where(StudentSession.session_id.in_(session_ids))
            )
        ).scalar() or 0
        completed_ss = (
            await db.execute(
                select(func.count()).select_from(StudentSession)
                .where(
                    StudentSession.session_id.in_(session_ids),
                    StudentSession.status == "completed",
                )
            )
        ).scalar() or 0
        completion_rate = (completed_ss / total_ss * 100) if total_ss > 0 else 0.0

    # Performance trend – last 10 sessions avg scores
    performance_trend: list[float] = []
    if session_ids:
        last_sessions_result = await db.execute(
            select(Session.id)
            .where(Session.id.in_(session_ids))
            .order_by(Session.created_at.desc())
            .limit(10)
        )
        last_session_ids = [row[0] for row in last_sessions_result.fetchall()]
        for sid in reversed(last_session_ids):
            res = await db.execute(
                select(func.avg(StudentSession.score * 100.0 / func.nullif(StudentSession.max_score, 0)))
                .where(
                    StudentSession.session_id == sid,
                    StudentSession.max_score > 0,
                )
            )
            val = res.scalar() or 0.0
            performance_trend.append(round(float(val), 2))

    return ModuleAnalytics(
        module_id=module_id,
        module_title=module.title,
        total_lessons=len(lessons),
        total_activities=len(activities),
        total_sessions=len(sessions),
        total_students=students_count,
        avg_score_percentage=round(avg_score, 2),
        completion_rate=round(completion_rate, 2),
        performance_trend=performance_trend,
    )


@router.get("/activities/{activity_id}", response_model=ActivityAnalytics)
async def get_activity_analytics(
    activity_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ActivityAnalytics:
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise NotFoundException("Activity not found")
    if activity.teacher_id != teacher.id:
        raise ForbiddenException("Not your activity")

    # Sessions & attempts
    sessions_result = await db.execute(
        select(Session).where(Session.activity_id == activity_id)
    )
    sessions = sessions_result.scalars().all()
    session_ids = [s.id for s in sessions]
    total_sessions = len(sessions)

    total_attempts = 0
    score_buckets = {
        "0-20%": 0,
        "20-40%": 0,
        "40-60%": 0,
        "60-80%": 0,
        "80-100%": 0,
    }

    if session_ids:
        ss_result = await db.execute(
            select(StudentSession).where(StudentSession.session_id.in_(session_ids))
        )
        student_sessions = ss_result.scalars().all()
        total_attempts = len(student_sessions)

        for ss in student_sessions:
            if ss.max_score > 0:
                pct = ss.score / ss.max_score * 100
            else:
                pct = 0.0
            if pct < 20:
                score_buckets["0-20%"] += 1
            elif pct < 40:
                score_buckets["20-40%"] += 1
            elif pct < 60:
                score_buckets["40-60%"] += 1
            elif pct < 80:
                score_buckets["60-80%"] += 1
            else:
                score_buckets["80-100%"] += 1

    score_distribution = [
        ScoreBucket(label=k, count=v) for k, v in score_buckets.items()
    ]

    # Question difficulty
    questions_result = await db.execute(
        select(Question).where(Question.activity_id == activity_id).order_by(Question.sort_order)
    )
    questions = questions_result.scalars().all()

    question_difficulty: list[QuestionDifficulty] = []
    total_question_times: list[float] = []

    for q in questions:
        resp_result = await db.execute(
            select(Response).where(Response.question_id == q.id)
        )
        responses = resp_result.scalars().all()
        total_resp = len(responses)
        correct = sum(1 for r in responses if r.is_correct)
        correct_pct = (correct / total_resp * 100) if total_resp > 0 else 0.0
        avg_t = (sum(r.time_spent_seconds for r in responses) / total_resp) if total_resp > 0 else 0.0
        total_question_times.append(avg_t)

        question_difficulty.append(
            QuestionDifficulty(
                question_id=q.id,
                question_type=q.question_type,
                correct_pct=round(correct_pct, 2),
                avg_time_seconds=round(avg_t, 2),
            )
        )

    avg_time_per_question = (
        sum(total_question_times) / len(total_question_times)
        if total_question_times
        else 0.0
    )

    return ActivityAnalytics(
        activity_id=activity_id,
        activity_title=activity.title,
        total_sessions=total_sessions,
        total_attempts=total_attempts,
        score_distribution=score_distribution,
        question_difficulty=question_difficulty,
        avg_time_per_question=round(avg_time_per_question, 2),
    )


@router.get("/students/{student_id}", response_model=StudentAnalytics)
async def get_student_analytics(
    student_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> StudentAnalytics:
    # Only allow viewing students that participated in teacher's sessions
    teacher_sessions_subq = select(Session.id).where(Session.teacher_id == teacher.id).subquery()

    ss_result = await db.execute(
        select(StudentSession)
        .where(
            StudentSession.student_id == student_id,
            StudentSession.session_id.in_(select(teacher_sessions_subq)),
        )
        .order_by(StudentSession.created_at)
    )
    student_sessions = ss_result.scalars().all()

    if not student_sessions:
        raise NotFoundException("Student not found in your sessions")

    nickname = student_sessions[0].nickname
    total_sessions = len(student_sessions)

    scores_with_max = [
        (ss.score, ss.max_score)
        for ss in student_sessions
        if ss.max_score > 0
    ]
    avg_score = (
        sum(s / m * 100 for s, m in scores_with_max) / len(scores_with_max)
        if scores_with_max
        else 0.0
    )

    # Score trend
    score_trend = []
    for ss in student_sessions:
        pct = (ss.score / ss.max_score * 100) if ss.max_score > 0 else 0.0
        score_trend.append({
            "session_id": str(ss.session_id),
            "score_pct": round(pct, 2),
            "date": ss.created_at.isoformat() if ss.created_at else "",
        })

    # Strengths/weaknesses by question type
    ss_ids = [ss.id for ss in student_sessions]
    resp_result = await db.execute(
        select(Response).where(Response.student_session_id.in_(ss_ids))
    )
    responses = resp_result.scalars().all()

    q_ids = list({r.question_id for r in responses})
    questions_result = await db.execute(
        select(Question).where(Question.id.in_(q_ids))
    ) if q_ids else None
    questions_map: dict[uuid.UUID, Question] = {}
    if questions_result:
        for q in questions_result.scalars().all():
            questions_map[q.id] = q

    type_stats: dict[str, dict[str, int]] = {}
    for r in responses:
        q = questions_map.get(r.question_id)
        if not q:
            continue
        qt = q.question_type
        if qt not in type_stats:
            type_stats[qt] = {"correct": 0, "total": 0}
        type_stats[qt]["total"] += 1
        if r.is_correct:
            type_stats[qt]["correct"] += 1

    strengths = []
    weaknesses = []
    for qt, stats in type_stats.items():
        acc = (stats["correct"] / stats["total"] * 100) if stats["total"] > 0 else 0.0
        entry = {"question_type": qt, "accuracy": round(acc, 2), "total": stats["total"]}
        if acc >= 70:
            strengths.append(entry)
        else:
            weaknesses.append(entry)

    strengths.sort(key=lambda x: x["accuracy"], reverse=True)
    weaknesses.sort(key=lambda x: x["accuracy"])

    return StudentAnalytics(
        student_id=student_id,
        nickname=nickname,
        total_sessions=total_sessions,
        avg_score=round(avg_score, 2),
        score_trend=score_trend,
        strengths=strengths,
        weaknesses=weaknesses,
    )


@router.get("/engagement", response_model=EngagementMetrics)
async def get_engagement(
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> EngagementMetrics:
    now = datetime.now(timezone.utc)
    weeks = 8

    sessions_per_week: list[WeekDataPoint] = []
    active_students_per_week: list[WeekDataPoint] = []
    avg_completion_per_week: list[WeekDataPoint] = []
    avg_time_per_week: list[WeekDataPoint] = []

    for i in range(weeks - 1, -1, -1):
        week_start = now - timedelta(weeks=i + 1)
        week_end = now - timedelta(weeks=i)
        week_label = week_start.strftime("%d/%m")

        # Sessions created this week
        session_count = (
            await db.execute(
                select(func.count()).select_from(Session).where(
                    Session.teacher_id == teacher.id,
                    Session.created_at >= week_start,
                    Session.created_at < week_end,
                )
            )
        ).scalar() or 0
        sessions_per_week.append(WeekDataPoint(week=week_label, value=float(session_count)))

        # Session IDs for this week
        week_sessions_result = await db.execute(
            select(Session.id).where(
                Session.teacher_id == teacher.id,
                Session.created_at >= week_start,
                Session.created_at < week_end,
            )
        )
        week_session_ids = [row[0] for row in week_sessions_result.fetchall()]

        if week_session_ids:
            # Active students
            student_count = (
                await db.execute(
                    select(func.count(func.distinct(StudentSession.student_id)))
                    .where(StudentSession.session_id.in_(week_session_ids))
                )
            ).scalar() or 0
            active_students_per_week.append(WeekDataPoint(week=week_label, value=float(student_count)))

            # Completion rate
            total_ss = (
                await db.execute(
                    select(func.count()).select_from(StudentSession)
                    .where(StudentSession.session_id.in_(week_session_ids))
                )
            ).scalar() or 0
            completed_ss = (
                await db.execute(
                    select(func.count()).select_from(StudentSession)
                    .where(
                        StudentSession.session_id.in_(week_session_ids),
                        StudentSession.status == "completed",
                    )
                )
            ).scalar() or 0
            cr = (completed_ss / total_ss * 100) if total_ss > 0 else 0.0
            avg_completion_per_week.append(WeekDataPoint(week=week_label, value=round(cr, 2)))

            # Avg time
            avg_time_res = await db.execute(
                select(func.avg(StudentSession.time_spent_seconds))
                .where(StudentSession.session_id.in_(week_session_ids))
            )
            avg_time = float(avg_time_res.scalar() or 0.0)
            avg_time_per_week.append(WeekDataPoint(week=week_label, value=round(avg_time, 2)))
        else:
            active_students_per_week.append(WeekDataPoint(week=week_label, value=0.0))
            avg_completion_per_week.append(WeekDataPoint(week=week_label, value=0.0))
            avg_time_per_week.append(WeekDataPoint(week=week_label, value=0.0))

    return EngagementMetrics(
        sessions_per_week=sessions_per_week,
        active_students_per_week=active_students_per_week,
        avg_completion_rate_per_week=avg_completion_per_week,
        avg_time_per_week=avg_time_per_week,
    )
