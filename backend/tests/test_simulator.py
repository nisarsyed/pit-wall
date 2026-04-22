import math

import pytest

from pit_wall.data.curves import CompoundCurve, RaceCurves, StrategyStint
from pit_wall.sim.simulator import simulate


def _race(total_laps: int = 5) -> RaceCurves:
    # tiny race with zero tyre deg / zero intercept so arithmetic is traceable by hand
    flat = CompoundCurve(slope=0.0, intercept=0.0, r2=1.0, valid_stint_range=(1, 10))
    return RaceCurves(
        name="Mini", country="X", year=2023,
        total_laps=total_laps,
        base_lap_time_s=90.0,
        pit_loss_s=20.0,
        compounds={"SOFT": flat, "MEDIUM": flat},
    )


def test_simulate_matches_hand_arithmetic_on_flat_curves():
    race = _race(total_laps=5)
    strat = [
        StrategyStint(compound="SOFT",   start_lap=1),
        StrategyStint(compound="MEDIUM", start_lap=3),  # pit on lap 3
    ]
    result = simulate(race, strat)

    # Per-lap fuel at start_lap 1..5 of a 5-lap race:
    # lap 1 -> 110 kg remaining -> fuel_delta = 110 * 0.035 = 3.85
    # lap 2 -> 110 * 3/4 = 82.5   -> 2.8875
    # lap 3 -> 110 * 2/4 = 55     -> 1.925   + pit_loss 20.0 (lap 3 is a pit lap)
    # lap 4 -> 110 * 1/4 = 27.5   -> 0.9625
    # lap 5 -> 0                  -> 0.0
    # With slope=0, intercept=0 → tyre_delta is always 0.
    # lap_time = base (90) + tyre_delta (0) + fuel_delta + pit_loss
    expected_lap_times = [
        90.0 + 3.85,
        90.0 + 2.8875,
        90.0 + 1.925 + 20.0,
        90.0 + 0.9625,
        90.0 + 0.0,
    ]
    expected_total = sum(expected_lap_times)
    for got, want in zip(result.lap_times, expected_lap_times, strict=True):
        assert math.isclose(got, want, rel_tol=1e-9), f"got {got}, want {want}"
    assert math.isclose(result.total_time_s, expected_total, rel_tol=1e-9)
    assert len(result.cumulative_times) == 5
    assert math.isclose(result.cumulative_times[-1], expected_total, rel_tol=1e-9)


def test_tyre_delta_accrues_within_stint():
    # MEDIUM slope 0.1, intercept 0. 4-lap race pitting on lap 3.
    # MEDIUM for laps 1-2, SOFT for laps 3-4.
    race = RaceCurves(
        name="X", country="X", year=2023, total_laps=4,
        base_lap_time_s=90.0, pit_loss_s=20.0,
        compounds={
            "SOFT":   CompoundCurve(slope=0.0, intercept=0.0, r2=1.0, valid_stint_range=(1, 10)),
            "MEDIUM": CompoundCurve(slope=0.1, intercept=0.0, r2=1.0, valid_stint_range=(1, 10)),
        },
    )
    strat = [
        StrategyStint(compound="MEDIUM", start_lap=1),
        StrategyStint(compound="SOFT",   start_lap=3),
    ]
    result = simulate(race, strat)
    # Fuel: total_laps=4, so fuel_kg_remaining(lap, 4) = 110 * (1 - (lap-1)/3).
    # lap 1: 110 kg → fuel_delta = 3.85
    # lap 2: 110 * 2/3 ≈ 73.3333 → fuel_delta ≈ 2.5667
    # lap 3: 110 * 1/3 ≈ 36.6667 → fuel_delta ≈ 1.2833, + pit_loss 20
    # lap 4: 0 → fuel_delta = 0
    # MEDIUM tyre_delta: slope*stint_lap + intercept = 0.1*stint_lap + 0.
    # SOFT: flat 0.
    expected = [
        90.0 + 0.1 + 110.0 * 1.0        * 0.035,   # lap 1: MEDIUM stint_lap=1, fuel 110
        90.0 + 0.2 + 110.0 * (2.0 / 3.0) * 0.035,  # lap 2: MEDIUM stint_lap=2, fuel 110*2/3
        90.0 + 0.0 + 110.0 * (1.0 / 3.0) * 0.035 + 20.0,  # lap 3: SOFT stint_lap=1, pit
        90.0 + 0.0 + 0.0,                           # lap 4: SOFT stint_lap=2, fuel=0
    ]
    for got, want in zip(result.lap_times, expected, strict=True):
        assert math.isclose(got, want, rel_tol=1e-9), f"got {got}, want {want}"


def test_simulate_raises_on_invalid_strategy():
    from pit_wall.sim.validator import StrategyError
    race = _race(total_laps=5)
    strat = [StrategyStint(compound="SOFT", start_lap=1)]  # single compound
    with pytest.raises(StrategyError):
        simulate(race, strat)


def test_total_vs_actual_delta():
    race = _race(total_laps=5)
    # SOFT->MEDIUM on lap 3. With flat curves, total_time computed deterministically.
    strat = [
        StrategyStint(compound="SOFT",   start_lap=1),
        StrategyStint(compound="MEDIUM", start_lap=3),
    ]
    result = simulate(race, strat, actual_winning_time_s=500.0)
    assert result.total_time_vs_actual_s is not None
    assert math.isclose(result.total_time_vs_actual_s, result.total_time_s - 500.0)


def test_total_vs_actual_delta_none_when_no_baseline():
    race = _race(total_laps=5)
    strat = [
        StrategyStint(compound="SOFT",   start_lap=1),
        StrategyStint(compound="MEDIUM", start_lap=3),
    ]
    result = simulate(race, strat)  # no actual_winning_time_s
    assert result.total_time_vs_actual_s is None
