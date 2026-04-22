import math

import pytest

from pit_wall.data.curves import CompoundCurve, RaceCurves, StrategyStint, load_curves
from pit_wall.sim.calibration import calibrate, calibrate_all
from pit_wall.sim.simulator import simulate


@pytest.fixture
def curated_curves() -> dict[str, RaceCurves]:
    return load_curves()


def test_calibrated_winner_strategy_has_near_zero_delta(
    curated_curves: dict[str, RaceCurves],
) -> None:
    calibrated = calibrate_all(curated_curves)
    checked = 0
    for race_id, race in calibrated.items():
        winner = race.actual_winner
        assert winner is not None, f"{race_id} has no actual_winner in fixture"
        # Skip races where the winner's strategy references a compound not in
        # the fitted curve set (e.g. wet-race INTERMEDIATE when only dry
        # compounds were fit). Calibration logs a warning for these.
        if any(s.compound not in race.compounds for s in winner.strategy):
            continue
        strategy = [
            StrategyStint(compound=s.compound, start_lap=s.start_lap) for s in winner.strategy
        ]
        result = simulate(race, strategy, actual_winning_time_s=winner.total_time_s)
        assert result.total_time_vs_actual_s is not None
        assert abs(result.total_time_vs_actual_s) < 0.01, (
            f"{race_id}: expected |delta| < 0.01, got {result.total_time_vs_actual_s:.3f}s"
        )
        checked += 1
    assert checked > 0, "no calibratable races found — regression?"


def test_calibrate_is_idempotent(curated_curves: dict[str, RaceCurves]) -> None:
    once = calibrate_all(curated_curves)
    twice = calibrate_all(once)
    for race_id, race in once.items():
        assert math.isclose(
            race.calibration_offset_s,
            twice[race_id].calibration_offset_s,
            rel_tol=1e-9,
            abs_tol=1e-9,
        ), f"{race_id} offset drifted on second calibration"


def test_calibrate_is_noop_when_no_winner() -> None:
    flat = CompoundCurve(slope=0.0, intercept=0.0, r2=1.0, valid_stint_range=(1, 10))
    race = RaceCurves(
        name="No-Winner",
        country="X",
        year=2023,
        total_laps=5,
        base_lap_time_s=90.0,
        pit_loss_s=20.0,
        compounds={"SOFT": flat, "MEDIUM": flat},
        actual_winner=None,
    )
    calibrated = calibrate(race)
    assert calibrated.calibration_offset_s == 0.0


def test_calibration_offset_shifts_lap_times(
    curated_curves: dict[str, RaceCurves],
) -> None:
    race = curated_curves["2023_hungary"]
    winner = race.actual_winner
    assert winner is not None
    strategy = [
        StrategyStint(compound=s.compound, start_lap=s.start_lap) for s in winner.strategy
    ]

    uncalibrated_total = simulate(race, strategy).total_time_s
    calibrated_total = simulate(calibrate(race), strategy).total_time_s

    assert not math.isclose(uncalibrated_total, calibrated_total, rel_tol=1e-6)
    assert abs(calibrated_total - winner.total_time_s) < 0.01
