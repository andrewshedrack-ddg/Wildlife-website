# WildGuard Society backend — container image
# Used by Azure Container Apps / Azure App Service (Linux containers).
# A multi-stage build keeps the runtime image slim.

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# psycopg2-binary ships prebuilt wheels on slim; eventlet needs no system deps.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py wsgi.py ./
COPY migrations ./migrations

# Run database migrations, then start the realtime-capable web server.
# -w 1 is required for socket.io (stateful background stats task, no sticky sessions).
CMD ["sh", "-c", "flask db upgrade && gunicorn -k eventlet -w 1 --timeout 120 --bind 0.0.0.0:8000 wsgi:app"]