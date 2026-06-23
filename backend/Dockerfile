FROM python:3.11-slim

WORKDIR /app

# System deps for WeasyPrint (PDF export)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# SQLite data dir (used when DATABASE_URL is sqlite)
RUN mkdir -p /app/data

EXPOSE 8000

# $PORT is injected by Railway at runtime
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
