.PHONY: dev dev-backend dev-frontend infra migrate test

infra:
	docker-compose up -d

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

migrate:
	cd backend && alembic upgrade head

migration:
	cd backend && alembic revision --autogenerate -m "$(msg)"

test-backend:
	cd backend && pytest -v

test-frontend:
	cd frontend && npm test

seed:
	cd backend && python -m app.db.seed
