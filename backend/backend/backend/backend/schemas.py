"""
schemas.py — Pydantic v2 request/response models.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RunRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)


class ScoresOut(BaseModel):
    truthfulness: float
    reasoning: float
    safety: float
    clarity: float

    @property
    def average(self) -> float:
        return (self.truthfulness + self.reasoning + self.safety + self.clarity) / 4


class ModelResponseOut(BaseModel):
    model_id: str
    model_name: str
    org: str
    body: str
    tokens: int
    latency_ms: int
    cost_usd: float
    scores: ScoresOut
    is_winner: bool


class VerdictOut(BaseModel):
    winner_id: str
    winner_name: str
    margin: float          # avg score gap between winner and runner-up
    total_tokens: int
    total_cost_usd: float
    total_latency_ms: int  # wall-clock (parallel), not sum


class RunOut(BaseModel):
    run_id: str
    prompt: str
    responses: list[ModelResponseOut]
    verdict: VerdictOut
    created_at: Optional[datetime] = None


# ── History ──────────────────────────────────────────────────────────────────

class HistoryItem(BaseModel):
    run_id: str
    prompt: str
    winner_id: str
    winner_name: str
    created_at: datetime
    total_cost_usd: float
    scores: dict[str, float]   # model_id -> avg score


class HistoryOut(BaseModel):
    items: list[HistoryItem]
    total: int


# ── Leaderboard ──────────────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    model_id: str
    model_name: str
    org: str
    wins: int
    total: int
    win_rate: float
    avg_score: float
    avg_latency_ms: float
    avg_cost_usd: float
    elo: int


class LeaderboardOut(BaseModel):
    entries: list[LeaderboardEntry]
    total_runs: int


# ── Status ───────────────────────────────────────────────────────────────────

class StatusOut(BaseModel):
    status: str
    mode: str               # "live" | "mock"
    models: list[str]
    db: str
