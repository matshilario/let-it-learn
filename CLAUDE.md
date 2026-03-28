# Let It Learn

SaaS multi-tenant para professores criarem atividades interativas online.

## Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Alembic
- **Database**: PostgreSQL 15+, Redis
- **Deploy**: Railway (2 services: frontend + backend)

## Project Structure
- `/frontend` - Next.js app (port 3000)
- `/backend` - FastAPI app (port 8000)

## Commands
- Backend: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm run dev`
- Migrations: `cd backend && alembic upgrade head`
- New migration: `cd backend && alembic revision --autogenerate -m "description"`
- Tests backend: `cd backend && pytest`
- Tests frontend: `cd frontend && npm test`
- Local infra: `docker-compose up -d` (Postgres + Redis)

## Conventions
- All API endpoints prefixed with `/api/v1`
- Multi-tenant isolation via `teacher_id` on all tenant-scoped queries
- JSONB for question type-specific config (avoids table-per-type)
- Portuguese (pt-BR) as primary language, English (en) secondary
- UUID for all primary keys
