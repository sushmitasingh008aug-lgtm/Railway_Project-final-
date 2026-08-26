# syntax=docker/dockerfile:1.6
# Multi-Stage Dockerfile for Full-Stack Block Planning System (Go API + Postgres-only)
# One command: `docker compose up --build` → postgres + Go (Fiber) API + React static on :3000
# Stage 1: Build React Frontend (Vite)
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY --link frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY --link frontend/ ./
# VITE_API_URL defaults to /api (same-origin) so build works both locally and in Docker
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Stage 2: Build Go Fiber binary
FROM golang:1.22-alpine AS go-builder
WORKDIR /app
RUN --mount=type=cache,target=/var/cache/apk,sharing=locked apk add --no-cache git
COPY --link backend/go.mod backend/go.sum ./backend/
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    cd backend && go mod download
COPY --link backend/ ./backend/
COPY --link --from=frontend-builder /app/frontend/dist ./frontend/dist
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    cd backend && CGO_ENABLED=0 GOOS=linux go build -o /app/block_planner .

# Stage 3: Production runtime — Python for optimizer (OR-Tools) + Go binary
FROM python:3.11-slim
WORKDIR /app

# System deps: libpq for psycopg2, curl for healthcheck
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps — runtime only 6 heavy stable (no report 342M) — for fast rebuilds on slow WiFi
COPY --link engine/requirements.runtime.txt ./engine/requirements.runtime.txt
RUN --mount=type=cache,target=/root/.cache/pip pip install --timeout 60 --retries 10 -r engine/requirements.runtime.txt
# Report/ML libs (xgboost/shap/reportlab/matplotlib/seaborn) host-only for build_full_30page_report.py — not in Go runtime image

# App code + Go binary + frontend dist
COPY --link engine/ ./engine/
COPY --link --from=go-builder /app/block_planner ./block_planner
COPY --link --from=go-builder /app/frontend/dist ./frontend/dist
COPY --link backend/go.mod backend/go.sum ./backend/

# Entrypoint helper to auto-seed DB if empty (idempotent) and ensure schema
COPY --link --chmod=755 docker/entrypoint.sh /entrypoint.sh

ENV PORT=3000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHON_BIN=python3

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://localhost:${PORT:-3000}/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["./block_planner"]
