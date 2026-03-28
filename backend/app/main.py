from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.middleware import setup_cors


def create_app() -> FastAPI:
    application = FastAPI(
        title="Let It Learn API",
        description="Backend API for the Let It Learn SaaS platform",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    setup_cors(application)
    application.include_router(api_router)

    @application.get("/health")
    async def health_check() -> dict:
        return {"status": "healthy", "version": "0.1.0"}

    @application.exception_handler(Exception)
    async def global_exception_handler(request, exc: Exception) -> JSONResponse:  # noqa: ANN001
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return application


app = create_app()
