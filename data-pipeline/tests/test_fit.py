import math

import numpy as np
import pytest

from pipeline.fit import CompoundFit, fit_compound, fit_compound_from_stints


def test_fit_recovers_known_slope_and_intercept():
    # pace_delta = 0.08 * stint_lap + 0.10 + tiny noise
    rng = np.random.default_rng(seed=42)
    stint_laps = np.tile(np.arange(1, 21), 3)  # 3 synthetic stints of 20 laps each
    true_slope = 0.08
    true_intercept = 0.10
    noise = rng.normal(0, 0.02, size=stint_laps.shape)
    pace_delta = true_slope * stint_laps + true_intercept + noise

    fit = fit_compound(stint_laps=stint_laps, pace_delta=pace_delta)

    assert math.isclose(fit.slope, true_slope, abs_tol=0.01)
    assert math.isclose(fit.intercept, true_intercept, abs_tol=0.05)
    assert fit.r2 > 0.95
    assert fit.valid_stint_range == (1, 20)


def test_fit_from_stints_aggregates_correctly():
    # Two stints: 1..15 and 1..18, both following the same line.
    stints = [
        [(stint_lap, 0.05 * stint_lap + 0.2) for stint_lap in range(1, 16)],
        [(stint_lap, 0.05 * stint_lap + 0.2) for stint_lap in range(1, 19)],
    ]
    fit = fit_compound_from_stints(stints)
    assert math.isclose(fit.slope, 0.05, abs_tol=1e-9)
    assert math.isclose(fit.intercept, 0.2, abs_tol=1e-9)
    assert fit.r2 > 0.99
    assert fit.valid_stint_range == (1, 18)


def test_fit_rejects_insufficient_data():
    with pytest.raises(ValueError):
        fit_compound(stint_laps=np.array([1, 2]), pace_delta=np.array([0.1, 0.2]))


def test_compoundfit_serializes_to_dict():
    fit = CompoundFit(slope=0.08, intercept=0.1, r2=0.95, valid_stint_range=(1, 20))
    got = fit.to_dict()
    assert got == {
        "slope": 0.08,
        "intercept": 0.1,
        "r2": 0.95,
        "valid_stint_range": [1, 20],
    }
