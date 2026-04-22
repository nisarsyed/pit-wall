import json
from pathlib import Path

from pydantic import BaseModel, ValidationError

DEFAULT_CURVES_PATH = Path(__file__).parent / "curves.json"


class CompoundCurve(BaseModel):
    model_config = {"frozen": True}
    slope: float
    intercept: float
    r2: float
    valid_stint_range: tuple[int, int]


class StrategyStint(BaseModel):
    model_config = {"frozen": True}
    compound: str
    start_lap: int


class ActualWinner(BaseModel):
    model_config = {"frozen": True}
    name: str
    strategy: list[StrategyStint]
    total_time_s: float


class RaceCurves(BaseModel):
    model_config = {"frozen": True}
    name: str
    country: str
    year: int
    total_laps: int
    base_lap_time_s: float
    pit_loss_s: float
    compounds: dict[str, CompoundCurve]
    actual_winner: ActualWinner | None = None


def load_curves(path: Path = DEFAULT_CURVES_PATH) -> dict[str, RaceCurves]:
    if not path.exists():
        raise FileNotFoundError(path)
    raw = json.loads(path.read_text())
    if not isinstance(raw, dict):
        raise ValueError(f"curves root must be an object, got {type(raw).__name__}")
    try:
        return {rid: RaceCurves.model_validate(rdata) for rid, rdata in raw.items()}
    except ValidationError as exc:
        raise ValueError(f"invalid curves.json: {exc}") from exc
