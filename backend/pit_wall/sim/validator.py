"""Strategy validation (hard errors → 400) and warnings (non-blocking)."""

from pydantic import BaseModel

from pit_wall.data.curves import RaceCurves

LOW_R2_THRESHOLD = 0.5


class StrategyStint(BaseModel):
    model_config = {"frozen": True}
    compound: str
    start_lap: int


class StrategyError(ValueError):
    """Raised when a strategy is syntactically or semantically invalid for a race.

    The API layer converts these into HTTP 400 responses.
    """


def validate_strategy(race: RaceCurves, strategy: list[StrategyStint]) -> None:
    if not strategy:
        raise StrategyError("strategy must contain at least one stint")

    if strategy[0].start_lap != 1:
        raise StrategyError("first stint must have start_lap=1")

    # Stint start_laps must be strictly increasing.
    for prev, curr in zip(strategy, strategy[1:], strict=False):
        if curr.start_lap <= prev.start_lap:
            raise StrategyError(
                f"stints must have strictly increasing start_lap: "
                f"{prev.start_lap} -> {curr.start_lap}"
            )

    # Pit laps (every start_lap after the first) must be in [2, total_laps - 1].
    for stint in strategy[1:]:
        if stint.start_lap < 2 or stint.start_lap >= race.total_laps:
            raise StrategyError(
                f"pit lap {stint.start_lap} out of range "
                f"[2, {race.total_laps - 1}]"
            )

    # All compounds must be in the race's compound set.
    for stint in strategy:
        if stint.compound not in race.compounds:
            raise StrategyError(
                f"unknown compound '{stint.compound}' for this race; "
                f"allowed: {sorted(race.compounds.keys())}"
            )

    # At least 2 distinct compounds (dry-race regulation).
    distinct = {s.compound for s in strategy}
    if len(distinct) < 2:
        raise StrategyError(
            "strategy must use at least 2 distinct compounds (dry-race rule)"
        )


def _stint_length(strategy: list[StrategyStint], idx: int, total_laps: int) -> int:
    """Number of laps in stint idx (inclusive of start_lap through the lap before next stint)."""
    start = strategy[idx].start_lap
    end = strategy[idx + 1].start_lap - 1 if idx + 1 < len(strategy) else total_laps
    return end - start + 1


def warnings_for_strategy(race: RaceCurves, strategy: list[StrategyStint]) -> list[str]:
    """Non-blocking warnings returned alongside simulation results.

    Assumes strategy has already passed validate_strategy (will still be safe otherwise,
    but may return noisy warnings).
    """
    out: list[str] = []
    for idx, stint in enumerate(strategy):
        curve = race.compounds.get(stint.compound)
        if curve is None:
            continue
        stint_len = _stint_length(strategy, idx, race.total_laps)
        if stint_len > curve.valid_stint_range[1]:
            out.append(
                f"stint {idx + 1} ({stint.compound}, {stint_len} laps) "
                f"extrapolated beyond fit range "
                f"{curve.valid_stint_range[0]}-{curve.valid_stint_range[1]}"
            )
        if curve.r2 < LOW_R2_THRESHOLD:
            out.append(
                f"compound {stint.compound} fit has low R² ({curve.r2:.2f}); "
                f"predictions may be noisy"
            )
    return out
