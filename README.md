# Todo App (FastAPI + Docker) for Terraform Practice

Simple full-stack todo app:
- FastAPI REST backend (`/api/todos`)
- Static frontend served by FastAPI (`/`)
- Dockerized for local run and future Terraform deployment

## API Endpoints
- `GET /api/health`
- `GET /api/todos`
- `POST /api/todos` with body `{ "title": "task" }`
- `PATCH /api/todos/{id}` with body `{ "title": "...", "completed": true }`
- `DELETE /api/todos/{id}`

## Run Locally (without Docker)
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000`.

## Run with Docker Compose
```bash
docker compose up --build
```

Open `http://localhost:8000`.

## Terraform Starter
Terraform scaffold is under `terraform/` with base files for:
- provider config
- variables and outputs
- placeholder for AWS deployment resources

## CI/CD Docs
- GitHub Actions + Terraform: `docs/github-actions-terraform.md`
- Future Jenkins migration: `docs/jenkins-terraform-migration.md`
