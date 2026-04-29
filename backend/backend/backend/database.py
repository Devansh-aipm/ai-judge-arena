"""
database.py — SQLAlchemy async setup with SQLite.
Schema: runs, responses, scores.
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text,
    ForeignKey, DateTime, JSON, func
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
import uuid
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./judge_arena.db")

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


class Run(Base):
    """One arena run = one prompt sent to all models."""
    __tablename__ = "runs"

    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt      = Column(Text, nullable=False)
    winner_id   = Column(String, nullable=True)        # model id of winner
    created_at  = Column(DateTime, server_default=func.now())
    total_tokens = Column(Integer, default=0)
    total_cost_usd = Column(Float, default=0.0)
    total_latency_ms = Column(Integer, default=0)

    responses   = relationship("Response", back_populates="run", cascade="all, delete-orphan")


class Response(Base):
    """One model's response within a run."""
    __tablename__ = "responses"

    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id      = Column(String, ForeignKey("runs.id"), nullable=False)
    model_id    = Column(String, nullable=False)       # "claude", "gpt", "gemini"
    body        = Column(Text, nullable=False)
    tokens      = Column(Integer, default=0)
    latency_ms  = Column(Integer, default=0)
    cost_usd    = Column(Float, default=0.0)
    is_winner   = Column(Boolean, default=False)

    scores      = relationship("Score", back_populates="response", cascade="all, delete-orphan")
    run         = relationship("Run", back_populates="responses")


class Score(Base):
    """Rubric score (0-100) for a dimension."""
    __tablename__ = "scores"

    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    response_id = Column(String, ForeignKey("responses.id"), nullable=False)
    dimension   = Column(String, nullable=False)  # "truthfulness" | "reasoning" | "safety" | "clarity"
    value       = Column(Float, nullable=False)

    response    = relationship("Response", back_populates="scores")


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
