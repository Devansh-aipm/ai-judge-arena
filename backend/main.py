"""
main.py — FastAPI application entry point.

Routes:
    POST /api/run          Run the arena
    GET  /api/history      Paginated run history
    GET  /api/leaderboard  Model rankings
    GET  /api/status       Health + config check
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import pathlib

from database import init_db, get_session
from service import ArenaService
from schemas import RunRequest, RunOut, HistoryOut, LeaderboardOut, StatusOut


# ── Lifespan ──────────────────────────────────────────────────────────────────

arena: ArenaService | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global arena
    await init_db()
    arena = ArenaService()
    print(f"[judge-arena] mode={arena.mode}  adapters={list(arena.adapters.keys())}")
    yield
    # cleanup (nothing needed for SQLite)


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Judge Arena API",
    version="0.4.0",
    description="AI model evaluation platform — one prompt, three minds, one verdict.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── API routes ────────────────────────────────────────────────────────────────

@app.post("/api/run", response_model=RunOut, summary="Run the arena")
async def run_arena(
    body: RunRequest,
    db: AsyncSession = Depends(get_session),
):
    """
    Send a prompt to all configured models simultaneously.
    Returns responses, per-dimension scores, and a winner verdict.
    """
    try:
        return await arena.run_arena(body.prompt, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/history", response_model=HistoryOut, summary="Run history")
async def get_history(
    limit: int  = Query(50,  ge=1, le=200),
    offset: int = Query(0,   ge=0),
    db: AsyncSession = Depends(get_session),
):
    """Paginated list of past arena runs, newest first."""
    return await arena.get_history(db, limit=limit, offset=offset)


@app.get("/api/leaderboard", response_model=LeaderboardOut, summary="Model leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_session)):
    """Aggregate win rates, ELO estimates, and benchmark stats."""
    return await arena.get_leaderboard(db)


@app.get("/api/status", response_model=StatusOut, summary="Service health")
async def get_status():
    return StatusOut(
        status="operational",
        mode=arena.mode,
        models=list(arena.adapters.keys()),
        db="sqlite",
    )


# ── Static frontend (served in production) ───────────────────────────────────

BASE_DIR = pathlib.Path(__file__).parent.parent  # project root
frontend_dir = BASE_DIR / "frontend"

if frontend_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(str(frontend_dir / "index.html"))

    @app.get("/{path:path}", include_in_schema=False)
    async def serve_spa(path: str):
        """Fallback — serve index.html for all non-API routes."""
        full = frontend_dir / path
        if full.is_file():
            return FileResponse(str(full))
        return FileResponse(str(frontend_dir / "index.html"))
