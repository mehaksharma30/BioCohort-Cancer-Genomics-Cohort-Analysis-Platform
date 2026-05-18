.PHONY: up down logs build seed test clean

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

seed:
	docker compose exec postgres psql -U biocohort -d biocohort -f /docker-entrypoint-initdb.d/002_seed_data.sql

test:
	cd services/shared && go test ./...
	cd services/api-gateway && go test ./...
	cd services/ingestion-service && go test ./...
	cd services/cohort-service && go test ./...
	cd services/analytics-service && go test ./...
	cd services/quality-service && go test ./...
	cd frontend && npm run build

clean:
	docker compose down -v --remove-orphans
