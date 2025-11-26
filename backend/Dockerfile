FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/app \
    WEB_CONCURRENCY=2 \
    GUNICORN_TIMEOUT=90 \
    GUNICORN_GRACEFUL_TIMEOUT=30 \
    GUNICORN_KEEP_ALIVE=75 \
    GUNICORN_MAX_REQUESTS=2000 \
    GUNICORN_MAX_REQUESTS_JITTER=200 \
    RUN_SEED_DATA=true

WORKDIR ${APP_HOME}

# Install system dependencies (optional: build tools if you have dependencies like numpy, pandas etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir "gunicorn==22.0.0"

# Copy application code
COPY . .

# Preserve existing start script (used outside containers)
RUN chmod +x start.sh

# Container entrypoint with resilient worker config
RUN cat <<'EOF' > ${APP_HOME}/docker-entrypoint.sh
#!/bin/bash
set -euo pipefail

echo "Starting TicketSystem Backend..."

MONGO_HOST="${MONGO_HOST:-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"

echo "Waiting for MongoDB to be ready..."
until nc -z "${MONGO_HOST}" "${MONGO_PORT}"; do
    sleep 1
done
echo "MongoDB is ready!"

if [ "${RUN_SEED_DATA,,}" != "false" ]; then
    echo "Running seed data script..."
    python -m src.seed_data
fi

AVAILABLE_CPUS="$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 1)"
if [ -z "${AVAILABLE_CPUS}" ] || [ "${AVAILABLE_CPUS}" -lt 1 ]; then
    AVAILABLE_CPUS=1
fi
DEFAULT_WORKERS=$(( AVAILABLE_CPUS * 2 ))
if [ "${DEFAULT_WORKERS}" -lt 2 ]; then
    DEFAULT_WORKERS=2
fi
WORKERS="${WEB_CONCURRENCY:-${DEFAULT_WORKERS}}"

echo "Starting Gunicorn with ${WORKERS} workers..."
exec gunicorn main:app \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --workers "${WORKERS}" \
    --worker-tmp-dir /dev/shm \
    --timeout "${GUNICORN_TIMEOUT:-90}" \
    --graceful-timeout "${GUNICORN_GRACEFUL_TIMEOUT:-30}" \
    --keep-alive "${GUNICORN_KEEP_ALIVE:-75}" \
    --max-requests "${GUNICORN_MAX_REQUESTS:-2000}" \
    --max-requests-jitter "${GUNICORN_MAX_REQUESTS_JITTER:-200}"
EOF

RUN chmod +x ${APP_HOME}/docker-entrypoint.sh

# Expose the port FastAPI runs on
EXPOSE 8000

# Set the entrypoint
CMD ["./docker-entrypoint.sh"]

