"""Pydantic request/response models for the public HTTP API.

Kept in a single file because the API surface is small (4 routes).
"""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    version: str


class StintRequest(BaseModel):
    compound: str = Field(min_length=1)
    start_lap: int = Field(ge=1)


class StrategyRequest(BaseModel):
    stints: list[StintRequest] = Field(min_length=1)


class CompoundCurveOut(BaseModel):
    slope: float
    intercept: float
    r2: float
    valid_stint_range: tuple[int, int]


class StrategyStintOut(BaseModel):
    compound: str
    start_lap: int


class ActualWinnerOut(BaseModel):
    name: str
    strategy: list[StrategyStintOut]
    total_time_s: float


class RaceListItem(BaseModel):
    id: str
    name: str
    country: str
    year: int
    total_laps: int
    compounds_available: list[str]
    actual_winner_name: str | None = None
    actual_winning_time_s: float | None = None


class RaceDetail(BaseModel):
    id: str
    name: str
    country: str
    year: int
    total_laps: int
    base_lap_time_s: float
    pit_loss_s: float
    compounds: dict[str, CompoundCurveOut]
    actual_winner: ActualWinnerOut | None = None


class SimulateResponse(BaseModel):
    lap_times: list[float]
    cumulative_times: list[float]
    total_time_s: float
    total_time_vs_actual_s: float | None
    warnings: list[str]


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
