from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import activities, analytics, auth, classes, gamification, lessons, modules, play, questions, sessions

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(modules.router, prefix="/modules", tags=["Modules"])
api_router.include_router(lessons.router, prefix="", tags=["Lessons"])
api_router.include_router(activities.router, prefix="", tags=["Activities"])
api_router.include_router(questions.router, prefix="", tags=["Questions"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
api_router.include_router(play.router, prefix="/play", tags=["Play"])
api_router.include_router(classes.router, prefix="/classes", tags=["Classes"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(gamification.router, prefix="/gamification", tags=["Gamification"])
