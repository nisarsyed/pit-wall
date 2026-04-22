"""Per-race calibration of the simulator.

The raw linear tyre-degradation fits absorb only a portion of real lap-time
variance (slipstream, SC/VSC, driver pushing, traffic, in/out laps).
Without correction, running the simulator on the winner's exact strategy
produces a total several seconds off their recorded time — so the UI's
`delta vs. actual winner` is always positive, regardless of strategy.

Calibration compensates by computing a single per-lap offset per race that,
when added to every simulated lap, makes `simulate(winner_strategy).total`
match the winner's recorded time. The offset is derived once at load time
and baked into `RaceCurves.calibration_offset_s`.

Races without an actual winner keep offset = 0.
"""

from loguru import logger

from pit_wall.data.curves import RaceCurves, StrategyStint
from pit_wall.sim.simulator import simulate
from pit_wall.sim.validator import StrategyError


def calibrate(race: RaceCurves) -> RaceCurves:
    winner = race.actual_winner
    if winner is None:
        return race
    strategy = [StrategyStint(compound=s.compound, start_lap=s.start_lap) for s in winner.strategy]
    # Run with whatever offset the race currently carries (usually 0 on first
    # calibration). Re-calibrating an already-calibrated race is a no-op
    # because the residual is already absorbed.
    try:
        uncalibrated = simulate(race, strategy)
    except StrategyError as exc:
        # Winner used a compound that the curated curve set doesn't cover
        # (e.g. a wet race where INTERMEDIATE wasn't fitted). Skip calibration
        # rather than failing startup — delta will remain uncalibrated for this
        # race, which is less bad than the whole service refusing to boot.
        logger.bind(race=race.name).warning(f"calibration skipped: {exc}")
        return race
    residual = uncalibrated.total_time_s - winner.total_time_s
    delta_per_lap = residual / race.total_laps
    return race.model_copy(
        update={"calibration_offset_s": race.calibration_offset_s - delta_per_lap}
    )


def calibrate_all(curves: dict[str, RaceCurves]) -> dict[str, RaceCurves]:
    return {race_id: calibrate(race) for race_id, race in curves.items()}
