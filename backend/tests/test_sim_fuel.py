import math

import pytest

from pit_wall.sim.fuel import FUEL_PENALTY_S_PER_KG, INITIAL_FUEL_KG, fuel_kg_remaining


def test_full_fuel_on_lap_1():
    assert fuel_kg_remaining(lap=1, total_laps=60) == INITIAL_FUEL_KG


def test_zero_fuel_on_final_lap():
    assert fuel_kg_remaining(lap=60, total_laps=60) == 0.0


def test_linear_burn_midpoint():
    got = fuel_kg_remaining(lap=30, total_laps=60)
    want = INITIAL_FUEL_KG * (1 - 29 / 59)
    assert math.isclose(got, want, rel_tol=1e-9)


@pytest.mark.parametrize("bad_lap", [0, -1, 61])
def test_rejects_out_of_range_lap(bad_lap: int):
    with pytest.raises(ValueError):
        fuel_kg_remaining(lap=bad_lap, total_laps=60)


def test_constants_match_pipeline():
    assert INITIAL_FUEL_KG == 110.0
    assert FUEL_PENALTY_S_PER_KG == 0.035
