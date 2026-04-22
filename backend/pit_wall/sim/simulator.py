"""Deterministic lap-by-lap race simulator.

Given fuel-corrected per-compound curves and a pit strategy, returns per-lap
times, cumulative times, and total race time. Deterministic — no randomness.
Microseconds per call (single race = ~60 lap loop).
"""

from dataclasses import dataclass

from pit_wall.data.curves import RaceCurves, StrategyStint
from pit_wall.sim.fuel import FUEL_PENALTY_S_PER_KG, fuel_kg_remaining
from pit_wall.sim.validator import validate_strategy

# Per-lap tyre penalty applied beyond a compound's fitted valid_stint_range[1].
# Scales linearly with excess stint lap, so the last lap of a long overshoot
# carries a much larger cost than the first — matching how real tyres fall off
# the cliff once grip drops. Keeps the linear-fit simulator from inventing
# implausible "skip a pit stop" strategies that the fit data doesn't support.
CLIFF_SLOPE_S_PER_LAP = 0.25


@dataclass(frozen=True)
class SimulationResult:
    lap_times: list[float]
    cumulative_times: list[float]
    total_time_s: float
    total_time_vs_actual_s: float | None  # None when no reference provided


def _stint_at_lap(strategy: list[StrategyStint], lap: int) -> tuple[StrategyStint, int]:
    """Return (stint, stint_lap) for the given global lap (1-indexed).

    stint_lap is 1-indexed within the stint (matching the pipeline's fit x-axis).
    """
    current = strategy[0]
    for s in strategy[1:]:
        if s.start_lap > lap:
            break
        current = s
    stint_lap = lap - current.start_lap + 1
    return current, stint_lap


def simulate(
    race: RaceCurves,
    strategy: list[StrategyStint],
    actual_winning_time_s: float | None = None,
) -> SimulationResult:
    validate_strategy(race, strategy)

    pit_laps = {s.start_lap for s in strategy[1:]}
    lap_times: list[float] = []
    cumulative: list[float] = []
    running = 0.0

    for lap in range(1, race.total_laps + 1):
        stint, stint_lap = _stint_at_lap(strategy, lap)
        curve = race.compounds[stint.compound]
        tyre_delta = curve.intercept + curve.slope * stint_lap
        cliff_excess = max(0, stint_lap - curve.valid_stint_range[1])
        tyre_delta += CLIFF_SLOPE_S_PER_LAP * cliff_excess
        fuel_delta = fuel_kg_remaining(lap, race.total_laps) * FUEL_PENALTY_S_PER_KG
        lap_time = (
            race.base_lap_time_s + tyre_delta + fuel_delta + race.calibration_offset_s
        )
        if lap in pit_laps:
            lap_time += race.pit_loss_s
        lap_times.append(lap_time)
        running += lap_time
        cumulative.append(running)

    delta = None if actual_winning_time_s is None else running - actual_winning_time_s

    return SimulationResult(
        lap_times=lap_times,
        cumulative_times=cumulative,
        total_time_s=running,
        total_time_vs_actual_s=delta,
    )
