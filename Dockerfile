# Multi-Stage Dockerfile for Full-Stack Block Planning System
# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python API & Optimization Engine
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt-get/lists/*

# Install Python requirements
COPY engine/requirements.txt ./engine_req.txt
RUN pip install --no-cache-dir \
    pandas \
    numpy \
    sqlalchemy \
    psycopg2-binary \
    xgboost \
    shap \
    reportlab \
    flask \
    flask-cors \
    ortools \
    matplotlib \
    seaborn

# Copy engine code & backend
COPY engine/ ./engine/
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Environment variables
ENV PORT=3000
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

# Start Flask REST API Server
CMD ["python", "backend/server.py"]
