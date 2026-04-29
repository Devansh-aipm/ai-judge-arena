"""
service.py — Arena orchestration logic.

RunArena.execute():
    1. Fire all model completions in parallel
    2. Score each response with the judge
    3. Determine winner
    4. Persist to DB
    5. Return RunOut
"""

import asyncio
import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, Integer
from sqlalchemy.orm import selectinload

from database import Run, Response, Score
from adapters import ModelResult, build_adapters
from schemas import (
    RunOut, ModelResponseOut, ScoresOut, VerdictOut,
    HistoryItem, HistoryOut, LeaderboardEntry, LeaderboardOut,
)

# Canonical model metadata (mirrored in frontend data.jsx)
MODEL_META = {
    "claude": {"name": "C-1 Sonnet",  "org": "Atlas Labs"},
    "gpt":    {"name": "G-4 Turbo",   "org": "Northstar AI"},
    "gemini": {"name": "M-2 Pro",     "org": "Vega Systems"},
}


class ArenaService:
    def __init__(self):
        self.adapters, self.judge = build_adapters()
        mode_flags = {
            mid: "mock" if adapter.__class__.__name__ == "MockAdapter" else "live"
            for mid, adapter in self.adapters.items()
        }
        self.mode = "live" if any(v == "live" for v in mode_flags.values()) else "mock"

    # ── Run ──────────────────────────────────────────────────────────────────

    async def run_arena(self, prompt: str, db: AsyncSession) -> RunOut:
        wall_start = time.monotonic()

        # 1. Fire model completions in parallel
        results: list[ModelResult] = await asyncio.gather(
            *[adapter.complete(prompt) for adapter in self.adapters.values()],
            return_exceptions=False,
        )

        wall_ms = int((time.monotonic() - wall_start) * 1000)

        # 2. Score each response in parallel (judge)
        score_tasks = [
            self.judge.score(prompt, r.body) for r in results
        ]
        raw_scores: list[dict] = await asyncio.gather(*score_tasks)

        # 3. Determine winner by average score
        def avg(s: dict) -> float:
            return sum(s.values()) / len(s)

        scored = list(zip(results, raw_scores))
        scored.sort(key=lambda x: avg(x[1]), reverse=True)
        winner_result, winner_scores = scored[0]
        runner_up_avg = avg(scored[1][1]) if len(scored) > 1 else 0.0
        margin = round(avg(winner_scores) - runner_up_avg, 2)

        # 4. Persist
        run_id = await self._persist(
            db=db,
            prompt=prompt,
            results=results,
            scores_list=raw_scores,
            winner_id=winner_result.model_id,
        )

        # 5. Build response
        responses_out = []
        for result, sc in zip(results, raw_scores):
            meta = MODEL_META.get(result.model_id, {"name": result.model_id, "org": "—"})
            responses_out.append(ModelResponseOut(
                model_id=result.model_id,
                model_name=meta["name"],
                org=meta["org"],
                body=result.body,
                tokens=result.tokens,
                latency_ms=result.latency_ms,
                cost_usd=result.cost_usd,
                scores=ScoresOut(**sc),
                is_winner=(result.model_id == winner_result.model_id),
            ))

        winner_meta = MODEL_META.get(winner_result.model_id, {"name": winner_result.model_id})

        return RunOut(
            run_id=run_id,
            prompt=prompt,
            responses=responses_out,
            verdict=VerdictOut(
                winner_id=winner_result.model_id,
                winner_name=winner_meta["name"],
                margin=margin,
                total_tokens=sum(r.tokens for r in results),
                total_cost_usd=round(sum(r.cost_usd for r in results), 6),
                total_latency_ms=wall_ms,
            ),
        )

    async def _persist(
        self,
        db: AsyncSession,
        prompt: str,
        results: list[ModelResult],
        scores_list: list[dict],
        winner_id: str,
    ) -> str:
        run = Run(
            prompt=prompt,
            winner_id=winner_id,
            total_tokens=sum(r.tokens for r in results),
            total_cost_usd=round(sum(r.cost_usd for r in results), 6),
        )
        db.add(run)
        await db.flush()

        for result, sc in zip(results, scores_list):
            resp = Response(
                run_id=run.id,
                model_id=result.model_id,
                body=result.body,
                tokens=result.tokens,
                latency_ms=result.latency_ms,
                cost_usd=result.cost_usd,
                is_winner=(result.model_id == winner_id),
            )
            db.add(resp)
            await db.flush()

            for dimension, value in sc.items():
                db.add(Score(
                    response_id=resp.id,
                    dimension=dimension,
                    value=float(value),
                ))

        await db.commit()
        return run.id

    # ── History ──────────────────────────────────────────────────────────────

    async def get_history(self, db: AsyncSession, limit: int = 50, offset: int = 0) -> HistoryOut:
        result = await db.execute(
            select(Run)
            .options(selectinload(Run.responses).selectinload(Response.scores))
            .order_by(desc(Run.created_at))
            .limit(limit)
            .offset(offset)
        )
        runs = result.scalars().all()

        count_result = await db.execute(select(func.count(Run.id)))
        total = count_result.scalar_one()

        items = []
        for run in runs:
            # Build per-model avg score dict
            scores_map = {}
            for resp in run.responses:
                if resp.scores:
                    avg_score = sum(s.value for s in resp.scores) / len(resp.scores)
                    scores_map[resp.model_id] = round(avg_score, 1)

            meta = MODEL_META.get(run.winner_id, {"name": run.winner_id})
            items.append(HistoryItem(
                run_id=run.id,
                prompt=run.prompt,
                winner_id=run.winner_id or "—",
                winner_name=meta["name"],
                created_at=run.created_at,
                total_cost_usd=run.total_cost_usd or 0,
                scores=scores_map,
            ))

        return HistoryOut(items=items, total=total)

    # ── Leaderboard ──────────────────────────────────────────────────────────

    async def get_leaderboard(self, db: AsyncSession) -> LeaderboardOut:
        # Aggregate stats per model across all runs
        result = await db.execute(
            select(
                Response.model_id,
                func.count(Response.id).label("total"),
                func.sum(Response.is_winner.cast(Integer)).label("wins"),
                func.avg(Response.latency_ms).label("avg_latency"),
                func.avg(Response.cost_usd).label("avg_cost"),
            )
            .group_by(Response.model_id)
        )
        rows = result.all()

        total_runs_result = await db.execute(select(func.count(Run.id)))
        total_runs = total_runs_result.scalar_one()

        # Per-model avg score
        score_result = await db.execute(
            select(
                Response.model_id,
                func.avg(Score.value).label("avg_score"),
            )
            .join(Score, Score.response_id == Response.id)
            .group_by(Response.model_id)
        )
        score_map = {r.model_id: round(r.avg_score, 1) for r in score_result.all()}

        entries = []
        for row in rows:
            wins = int(row.wins or 0)
            total = int(row.total or 1)
            win_rate = round(wins / total, 4)
            # Simple ELO estimate: base 1400 + win contribution
            elo_estimate = 1400 + int(win_rate * 120 - 60 + (score_map.get(row.model_id, 85) - 85) * 0.5)
            meta = MODEL_META.get(row.model_id, {"name": row.model_id, "org": "—"})

            entries.append(LeaderboardEntry(
                rank=0,  # assigned below
                model_id=row.model_id,
                model_name=meta["name"],
                org=meta["org"],
                wins=wins,
                total=total,
                win_rate=win_rate,
                avg_score=score_map.get(row.model_id, 0.0),
                avg_latency_ms=round(row.avg_latency or 0),
                avg_cost_usd=round(row.avg_cost or 0, 6),
                elo=elo_estimate,
            ))

        # Sort by ELO descending, assign ranks
        entries.sort(key=lambda e: e.elo, reverse=True)
        for i, e in enumerate(entries):
            e.rank = i + 1

        return LeaderboardOut(entries=entries, total_runs=total_runs)
