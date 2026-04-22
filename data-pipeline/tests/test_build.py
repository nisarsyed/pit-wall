import pandas as pd

from pipeline.build import RaceBuildInput, build_curves_for_race
from pipeline.manifest import Race


def _synthetic_laps() -> pd.DataFrame:
    """3 drivers, two stints each on MEDIUM then HARD, clean data."""
    rows: list[dict] = []
    for driver in ("VER", "HAM", "NOR"):
        for stint_idx, (compound, n_laps, base, slope) in enumerate(
            [("MEDIUM", 15, 90.0, 0.05), ("HARD", 20, 90.3, 0.04)], start=1
        ):
            for stint_lap in range(1, n_laps + 1):
                global_lap = (stint_idx - 1) * 15 + stint_lap + 1  # skip lap 1
                obs = base + slope * stint_lap
                rows.append(
                    {
                        "Driver": driver,
                        "LapNumber": global_lap,
                        "Stint": stint_idx,
                        "Compound": compound,
                        "LapTime": pd.Timedelta(seconds=obs),
                        "IsAccurate": True,
                        "TrackStatus": "1",
                        "PitInTime": pd.NaT,
                        "PitOutTime": pd.NaT,
                    }
                )
    return pd.DataFrame(rows)


def test_build_recovers_synthetic_slopes():
    race = Race(
        id="2023_test",
        name="Test GP",
        country="T",
        year=2023,
        round=1,
        session="R",
        pit_loss_s=22.0,
    )
    inp = RaceBuildInput(race=race, total_laps=36, laps=_synthetic_laps())
    result = build_curves_for_race(inp)

    # Synthetic data: raw_slope = 0.05 (MEDIUM) / 0.04 (HARD). No noise.
    # Fuel correction is linear in global_lap (= stint_lap + offset), so it adds
    # a constant slope component of INITIAL_FUEL_KG * FUEL_PENALTY_S_PER_KG / (total_laps - 1)
    # = 110 * 0.035 / 35 = 0.11 s/lap to every stint regardless of compound.
    # Expected fitted slope = raw_slope + 0.11:  MEDIUM=0.16, HARD=0.15.
    # NOTE: spec originally specified 0.05/0.04 ± 0.01, but the fuel-correction
    # contribution is 0.11 (not "slight"). These correct values were computed
    # analytically and confirmed by the actual fitter output. See review report.
    medium = result["compounds"]["MEDIUM"]
    hard = result["compounds"]["HARD"]
    assert abs(medium["slope"] - 0.16) < 0.01, f"MEDIUM slope {medium['slope']}"
    assert abs(hard["slope"] - 0.15) < 0.01, f"HARD slope {hard['slope']}"
    assert medium["r2"] > 0.95
    assert hard["r2"] > 0.95


def test_build_produces_expected_shape():
    race = Race(
        id="2023_test",
        name="Test GP",
        country="T",
        year=2023,
        round=1,
        session="R",
        pit_loss_s=22.0,
    )
    inp = RaceBuildInput(race=race, total_laps=36, laps=_synthetic_laps())
    result = build_curves_for_race(inp)

    assert set(result["compounds"].keys()) == {"MEDIUM", "HARD"}
    assert result["total_laps"] == 36
    assert result["pit_loss_s"] == 22.0
    assert isinstance(result["base_lap_time_s"], float)
    for compound in ("MEDIUM", "HARD"):
        curve = result["compounds"][compound]
        assert "slope" in curve and "intercept" in curve
        assert curve["r2"] >= 0.0
        assert len(curve["valid_stint_range"]) == 2
