# Eat-Rate-Love
A full-stack web application that explores Indian restaurants using Yelp data — featuring React frontend, FastAPI backend, sentiment analysis, keyword extraction, and interactive data visualizations.

## Run locally (without Docker)

Backend:
1) Open PowerShell in project root
2) Activate venv

```
.\backend\venv\Scripts\Activate.ps1
```

3) Install (if needed)

```
pip install -r backend\requirements.txt
```

4) Run

```
uvicorn backend.app.main:app --reload
```

Frontend:
1) Open a new PowerShell in `frontend/`
2) Optional: set API base if backend differs

```
$env:REACT_APP_API_BASE="http://localhost:8000"
```

3) Install and start

```
npm install
npm start
```

## Run with Docker (one command)

Prerequisites:
- Docker Desktop

Start both backend and frontend with hot-reload:

```
docker compose up --build
```

Services:
- Backend: `http://localhost:8000` (health: `/health`)
- Frontend: `http://localhost:3000`

Environment:
- The frontend talks to the backend via `REACT_APP_API_BASE=http://backend:8000` inside the compose network.

## Project Structure

- `backend/`: FastAPI app (sentiment, CSV search, upload and review storage in SQLite)
- `frontend/`: React app (sentiment UI, CSV search, reviews list)
- `database/`: SQLite DB files and optional schema helpers

## CI/CD and Deploy

Images to GHCR:
- On push to `main` or `v*.*.*` tags, GitHub Actions publishes:
  - `ghcr.io/<owner>/eat-rate-love-backend:{latest|<sha>}`
  - `ghcr.io/<owner>/eat-rate-love-frontend:{latest|<sha>}`
- Workflow files:
  - `.github/workflows/ci.yml` (build/test)
  - `.github/workflows/cd-ghcr.yml` (publish images)

Deploy to Render:
- Edit `render.yaml` and replace `REPLACE_ME_OWNER` with your GitHub org/user.
- Create two Web Services in Render from the repo; it will read the Dockerfiles.
- Backend health path: `/health`
- Frontend served on port 80 by Nginx.

Optional: Docker Hub
- If you prefer Docker Hub, add these secrets to the repo:
  - `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- Duplicate `cd-ghcr.yml` with Docker Hub registry/login and tags.

### Auto-deploy to Render

Workflow: `.github/workflows/deploy-render.yml`

Setup steps:
- In Render, create the two Web Services (backend with `backend/Dockerfile.prod`, frontend with `frontend/Dockerfile.prod`).
- In each service's Dashboard, copy its Service ID.
- In GitHub repo settings → Secrets and variables → Actions, add:
  - `RENDER_API_KEY`: your Render API key
  - `RENDER_BACKEND_SERVICE_ID`: backend service ID
  - `RENDER_FRONTEND_SERVICE_ID`: frontend service ID
- On push to `main`, the workflow will trigger deployments for both services (or run manually via “Run workflow”).

Staging (optional):
- Create a `develop` branch and two staging services in Render.
- Add secrets:
  - `RENDER_BACKEND_SERVICE_ID_STAGING`
  - `RENDER_FRONTEND_SERVICE_ID_STAGING`
- Workflow: `.github/workflows/deploy-render-staging.yml` triggers on pushes to `develop`.