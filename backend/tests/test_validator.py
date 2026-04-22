import pytest

from pit_wall.data.curves import CompoundCurve, RaceCurves, StrategyStint
from pit_wall.sim.validator import (
    StrategyError,
    validate_strategy,
    warnings_for_strategy,
)


def _race(total_laps: int = 57, compounds: dict[str, CompoundCurve] | None = None) -> RaceCurves:
    return RaceCurves(
        name="Test",
        country="X",
        year=2023,
        total_laps=total_laps,
        base_lap_time_s=90.0,
        pit_loss_s=22.0,
        compounds=compounds or {
            "SOFT":   CompoundCurve(slope=0.08, intercept=-0.1, r2=0.7, valid_stint_range=(1, 18)),
            "MEDIUM": CompoundCurve(slope=0.05, intercept=0.0,  r2=0.8, valid_stint_range=(1, 28)),
            "HARD":   CompoundCurve(slope=0.04, intercept=0.3,  r2=0.75, valid_stint_range=(1, 38)),
        },
    )


def test_valid_two_compound_strategy_passes():
    strat = [
        StrategyStint(compound="MEDIUM", start_lap=1),
        StrategyStint(compound="HARD",   start_lap=25),
    ]
    validate_strategy(_race(), strat)  # must not raise


def test_empty_stints_rejected():
    with pytest.raises(StrategyError, match="at least one stint"):
        validate_strategy(_race(), [])


def test_first_stint_must_start_at_lap_1():
    strat = [StrategyStint(compound="MEDIUM", start_lap=2)]
    with pytest.raises(StrategyError, match="start_lap=1"):
        validate_strategy(_race(), strat)


def test_single_compound_strategy_rejected():
    strat = [
        StrategyStint(compound="MEDIUM", start_lap=1),
        StrategyStint(compound="MEDIUM", start_lap=25),
    ]
    with pytest.raises(StrategyError, match="at least 2 distinct compounds"):
        validate_strategy(_race(), strat)


def test_pit_lap_out_of_range_rejected():
    strat = [
        StrategyStint(compound="MEDIUM", start_lap=1),
        StrategyStint(compound="HARD",   start_lap=57),  # == total_laps, invalid
    ]
    with pytest.raises(StrategyError, match="pit lap"):
        validate_strategy(_race(total_laps=57), strat)


def test_stints_must_be_strictly_increasing():
    strat = [
        StrategyStint(compound="MEDIUM", start_lap=1),
        StrategyStint(compound="HARD",   start_lap=25),
        StrategyStint(compound="SOFT",   start_lap=25),
    ]
    with pytest.raises(StrategyError, match="strictly increasing"):
        validate_strategy(_race(), strat)


def test_unknown_compound_rejected():
    strat = [
        StrategyStint(compound="MEDIUM",       start_lap=1),
        StrategyStint(compound="SUPERSOFT",    start_lap=25),
    ]
    with pytest.raises(StrategyError, match="compound 'SUPERSOFT'"):
        validate_strategy(_race(), strat)


def test_warning_on_stint_extrapolation():
    # SOFT valid_stint_range is [1, 18] in the fixture — 30-lap SOFT stint extrapolates
    strat = [
        StrategyStint(compound="SOFT",   start_lap=1),
        StrategyStint(compound="MEDIUM", start_lap=40),
    ]
    warns = warnings_for_strategy(_race(), strat)
    assert any("SOFT" in w and "extrapolated" in w for w in warns)


def test_warning_on_low_r2():
    race = _race(compounds={
        "MEDIUM": CompoundCurve(slope=0.05, intercept=0.0, r2=0.8, valid_stint_range=(1, 28)),
        # low r2:
        "HARD":   CompoundCurve(slope=0.04, intercept=0.3, r2=0.3, valid_stint_range=(1, 38)),
    })
    strat = [
        StrategyStint(compound="MEDIUM", start_lap=1),
        StrategyStint(compound="HARD",   start_lap=25),
    ]
    warns = warnings_for_strategy(race, strat)
    assert any("HARD" in w and "R²" in w for w in warns)


def test_no_warnings_for_clean_strategy():
    strat = [
        StrategyStint(compound="MEDIUM", start_lap=1),
        StrategyStint(compound="HARD",   start_lap=25),
    ]
    assert warnings_for_strategy(_race(), strat) == []


def test_low_r2_warning_dedups_across_repeated_compound():
    race = _race(
        compounds={
            # r2=0.3 is below LOW_R2_THRESHOLD (0.5) — intentionally low
            "MEDIUM": CompoundCurve(slope=0.05, intercept=0.0, r2=0.3, valid_stint_range=(1, 28)),
            "HARD":   CompoundCurve(slope=0.04, intercept=0.3, r2=0.8, valid_stint_range=(1, 38)),
        }
    )
    strat = [
        StrategyStint(compound="MEDIUM", start_lap=1),
        StrategyStint(compound="HARD",   start_lap=20),
        StrategyStint(compound="MEDIUM", start_lap=45),
    ]
    warns = warnings_for_strategy(race, strat)
    medium_low_r2 = [w for w in warns if "MEDIUM" in w and "R²" in w]
    assert len(medium_low_r2) == 1, f"expected 1 low-R² warning for MEDIUM, got {medium_low_r2}"
