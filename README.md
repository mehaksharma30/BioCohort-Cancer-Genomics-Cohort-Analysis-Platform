# BioCohort

BioCohort is a cloud-native cancer genomics cohort analysis platform built with Go microservices, React, PostgreSQL, Docker, Kubernetes, and S3-compatible object storage. It simulates an internal biomedical data platform for ingesting public NCI GDC/TCGA metadata, building filtered research cohorts, summarizing cohort analytics, and generating data-quality reports.

This project intentionally uses public research metadata only. It does not contain PHI, private patient records, or clinical production data.

## Architecture

```text
React + TypeScript dashboard
        |
Go API Gateway / BFF :8080
        |
+----------------+----------------+----------------+----------------+
| Ingestion :8081| Cohort :8082   | Analytics :8083| Quality :8084  |
+----------------+----------------+----------------+----------------+
        |                 |                |                |
        +---------------- PostgreSQL -----------------------+
        |
   MinIO S3-compatible raw payload storage
        |
   Public NCI GDC / TCGA API
```

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, Tailwind CSS, Recharts, Axios
- Backend: Go, Chi, PostgreSQL via pgx, MinIO SDK, REST APIs
- Infrastructure: Docker Compose, Kubernetes manifests, GitHub Actions, Makefile
- Local storage: PostgreSQL and MinIO
- Dataset: Public TCGA metadata from the NCI Genomic Data Commons API with seeded fallback rows

## Features

- Fetches TCGA case metadata from `https://api.gdc.cancer.gov/cases`
- Stores raw ingestion payloads in MinIO under `raw-ingestion/gdc/jobs/{job_id}.json`
- Normalizes projects, cases, and samples into PostgreSQL
- Creates cohorts using project, disease, site, gender, vital status, and age filters
- Generates overview and cohort-level analytics with SQL aggregation
- Calculates cohort quality scores from missing and invalid metadata
- Provides a complete React dashboard that calls only the API gateway

## UI/UX Highlights

- Enterprise healthcare analytics dashboard with polished React, Tailwind, Recharts, and responsive layouts.
- Reusable app shell, page headers, status badges, stat cards, chart cards, filter pills, empty states, and skeleton loading states.
- Ingestion fallback state for external GDC/API failures so demos continue with seeded public TCGA metadata.
- Cohort query preview that shows selected filters before saving a reproducible analysis-ready cohort.
- Visual data quality score card with color-coded completeness status and metric cards.

## Reliability Fix

The NCI GDC API can return clinical numeric fields as decimals, for example `24.0` for `days_to_last_follow_up`. The ingestion service now parses raw GDC clinical numbers as nullable decimals, converts them safely to nullable PostgreSQL integers, and handles missing or null diagnosis fields defensively.

If external GDC ingestion fails because the public API is unavailable or its schema changes, BioCohort marks the job as `COMPLETED_WITH_FALLBACK` when seeded TCGA demo data remains available. This keeps the dashboard, cohort builder, analytics, and quality report workflows usable for local demos.

## Local Setup

Prerequisites: Docker, Docker Compose, Make, Node 20 and Go 1.22 for local non-container builds.

```bash
cp .env.example .env
make up
```

Open:

- Frontend: http://localhost:5173
- API Gateway health: http://localhost:8080/health
- MinIO Console: http://localhost:9001

MinIO login:

- Username: `biocohort`
- Password: `biocohort123`

Seed data loads automatically from `db/init/002_seed_data.sql` when PostgreSQL starts with a fresh volume. If you need a clean reset:

```bash
make clean
make up
```

If another local PostgreSQL process already uses port `5432`, keep the container network unchanged and remap only the host port for development:

```bash
POSTGRES_PORT=55432 docker compose up --build
```

## Ports

| Component | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:8080 |
| Ingestion Service | http://localhost:8081 |
| Cohort Service | http://localhost:8082 |
| Analytics Service | http://localhost:8083 |
| Quality Service | http://localhost:8084 |
| PostgreSQL | localhost:5432 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |

## API Endpoints

| Method | Gateway endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/overview` | Dashboard totals and distributions |
| GET | `/api/projects` | List TCGA projects |
| GET | `/api/cancer-types` | Disease type counts |
| GET | `/api/cases` | Filter case metadata |
| POST | `/api/ingestion/jobs` | Start GDC ingestion |
| GET | `/api/ingestion/jobs` | List ingestion jobs |
| GET | `/api/cohorts` | List cohorts |
| POST | `/api/cohorts` | Create cohort |
| GET | `/api/cohorts/{id}` | Cohort definition |
| GET | `/api/cohorts/{id}/summary` | Cohort analytics |
| POST | `/api/cohorts/{id}/quality-report` | Generate quality report |
| GET | `/api/cohorts/{id}/quality-report` | Latest quality report |

## Database Summary

Core tables:

- `projects`: TCGA project metadata
- `cases`: normalized public case metadata
- `samples`: sample-level metadata linked to cases
- `ingestion_jobs`: GDC ingestion run history
- `cohorts`: saved cohort definitions and filters
- `cohort_cases`: many-to-many cohort membership
- `quality_reports`: generated completeness and validity reports

## Screenshots

Add screenshots after running locally:

- Dashboard: executive scientific overview with platform pipeline and service cards
- Ingestion: GDC job history, fallback status, and raw payload archive visibility
- Cohort Builder: card-based query form with live filter preview
- Cohort Detail: cohort-level distributions and analysis-ready dataset checks
- Quality Report: visual score card and validation metrics

## Kubernetes

Example local/minikube deployment:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.example.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/
```

For real environments, replace `secrets.example.yaml`, publish images to a registry, update image names, add persistent volumes, and run migrations through a controlled job.

## AWS Deployment Plan

- Replace local PostgreSQL with Amazon RDS for PostgreSQL.
- Replace MinIO with Amazon S3 and IAM role-based access.
- Run services on Amazon EKS with Kubernetes Deployments and Services.
- Use AWS Load Balancer Controller or API Gateway plus ALB ingress.
- Store configuration in AWS Secrets Manager or SSM Parameter Store.
- Publish images to Amazon ECR from GitHub Actions.
- Add observability with CloudWatch, OpenTelemetry, and structured logs.

## Resume Bullets

- Built BioCohort, a cloud-native cancer genomics cohort analysis platform using Go microservices, React, PostgreSQL, Docker, Kubernetes, and AWS-ready object storage to ingest public TCGA/GDC metadata, create filtered research cohorts, and visualize cohort-level clinical/data availability insights.

- Engineered ingestion, cohort, analytics, and data-quality services with REST APIs, SQL data modeling, S3-compatible raw-data storage, and CI/CD workflows, enabling reproducible metadata processing, missing-field validation, duplicate detection, and analysis-ready cohort summaries.

## Development Commands

```bash
make up      # build and run the stack
make down    # stop containers
make logs    # follow logs
make build   # build images
make test    # run Go tests and frontend build
make clean   # remove containers and volumes
```
