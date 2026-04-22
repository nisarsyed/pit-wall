# Use uv's official image as build stage (has uv + python)
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS build

WORKDIR /app

# Leverage cache: copy lockfile + pyproject first, then sync prod deps only
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Copy source and install the project itself
COPY pit_wall ./pit_wall
RUN uv sync --frozen --no-dev

# Runtime stage — smaller, no uv
FROM python:3.13-slim-bookworm

WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY --from=build /app/pit_wall /app/pit_wall

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8080
CMD ["uvicorn", "pit_wall.main:app", "--host", "0.0.0.0", "--port", "8080"]
