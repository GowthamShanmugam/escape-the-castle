# Escape the Castle - multi-stage build
# Push to quay.io/gshanmug-quay/escape-the-castle

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Run backend + serve frontend
FROM python:3.12-slim
WORKDIR /app

# Copy backend
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist frontend/dist

# Run from backend dir so "import db" resolves (db.py is sibling)
WORKDIR /app/backend

# SQLite DB will be at /app/backend/castle.db by default
# Override with CASTLE_DB_PATH for persistent volume
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
