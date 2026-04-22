# Pit Wall

An F1 race strategy simulator. Pick a historical race, edit pit-stop strategy on an interactive lap timeline, and see predicted total race time update live — grounded in tyre degradation curves fitted from real FastF1 stint data.

**Status:** in development. Live demo and hero GIF coming once M6 ships.

## Structure

- `backend/` — FastAPI service (Python 3.13, uv)
- `frontend/` — Next.js 16 app (React 19, TypeScript, Tailwind 4)
- `data-pipeline/` — offline pipeline that ingests FastF1 data and fits tyre degradation curves

## Quickstart

```bash
# Backend
cd backend && uv sync && uv run uvicorn pit_wall.main:app --reload

# Frontend (in another terminal)
cd frontend && pnpm install && pnpm dev
```

## Tech

Python 3.13 · FastAPI · FastF1 · Next.js 16 · React 19 · TypeScript · Tailwind 4 · Fly.io · Vercel

## License

MIT
