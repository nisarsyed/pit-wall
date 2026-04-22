import math

import pytest

from pipeline.fuel import (
    FUEL_PENALTY_S_PER_KG,
    INITIAL_FUEL_KG,
    fuel_correct_lap_time,
    fuel_kg_remaining,
)


def test_full_fuel_on_lap_1():
    assert fuel_kg_remaining(lap=1, total_laps=60) == INITIAL_FUEL_KG


def test_zero_fuel_on_final_lap():
    assert fuel_kg_remaining(lap=60, total_laps=60) == 0.0


def test_linear_burn_midpoint():
    # Midpoint lap (30 of 60, 0-indexed: lap 30 is the 30th of 59 intervals)
    # lap=30 -> fuel_remaining = INITIAL_FUEL_KG * (1 - 29/59)
    got = fuel_kg_remaining(lap=30, total_laps=60)
    want = INITIAL_FUEL_KG * (1 - 29 / 59)
    assert math.isclose(got, want, rel_tol=1e-9)


def test_fuel_correct_subtracts_penalty():
    # At lap 1 of a 60-lap race, penalty = 110 * 0.035 = 3.85s
    # Observed 100s -> corrected = 100 - 3.85 = 96.15s
    corrected = fuel_correct_lap_time(observed_s=100.0, lap=1, total_laps=60)
    expected = 100.0 - INITIAL_FUEL_KG * FUEL_PENALTY_S_PER_KG
    assert math.isclose(corrected, expected, rel_tol=1e-9)


def test_fuel_correct_noop_on_final_lap():
    corrected = fuel_correct_lap_time(observed_s=95.0, lap=60, total_laps=60)
    assert math.isclose(corrected, 95.0, rel_tol=1e-9)


@pytest.mark.parametrize("bad_lap", [0, -1, 61])
def test_fuel_correct_rejects_out_of_range_lap(bad_lap: int):
    with pytest.raises(ValueError):
        fuel_kg_remaining(lap=bad_lap, total_laps=60)
