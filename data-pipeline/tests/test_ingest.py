from datetime import timedelta

import pandas as pd
import pytest

from pipeline.ingest import CompoundStintLap, extract_valid_stint_laps


def _mk_lap(
    driver: str,
    lap_number: int,
    stint: int,
    compound: str,
    lap_time_s: float,
    is_accurate: bool = True,
    track_status: str = "1",
    pit_in: bool = False,
    pit_out: bool = False,
) -> dict:
    return {
        "Driver": driver,
        "LapNumber": lap_number,
        "Stint": stint,
        "Compound": compound,
        "LapTime": timedelta(seconds=lap_time_s),
        "IsAccurate": is_accurate,
        "TrackStatus": track_status,
        "PitInTime": pd.Timestamp("2023-01-01") if pit_in else pd.NaT,
        "PitOutTime": pd.Timestamp("2023-01-01") if pit_out else pd.NaT,
    }


def test_filters_inlaps_outlaps_and_sc() -> None:
    laps = pd.DataFrame(
        [
            _mk_lap("VER", 1, 1, "MEDIUM", 92.0),               # lap 1 -> drop
            _mk_lap("VER", 2, 1, "MEDIUM", 90.5),               # keep
            _mk_lap("VER", 3, 1, "MEDIUM", 91.0, track_status="4"),  # SC -> drop
            _mk_lap("VER", 4, 1, "MEDIUM", 90.7),               # keep
            _mk_lap("VER", 5, 1, "MEDIUM", 95.0, pit_in=True),  # in-lap -> drop
            _mk_lap("VER", 6, 2, "HARD",   94.0, pit_out=True), # out-lap -> drop
            _mk_lap("VER", 7, 2, "HARD",   91.5),               # keep
            _mk_lap("VER", 8, 2, "HARD",   91.6, is_accurate=False),  # not accurate -> drop
        ]
    )

    kept: list[CompoundStintLap] = extract_valid_stint_laps(laps)

    kept_lap_numbers = sorted(k.lap_number for k in kept)
    assert kept_lap_numbers == [2, 4, 7]


def test_drops_traffic_laps_over_107_of_stint_best():
    laps = pd.DataFrame(
        [
            _mk_lap("HAM", 2, 1, "MEDIUM", 90.0),
            _mk_lap("HAM", 3, 1, "MEDIUM", 90.2),
            _mk_lap("HAM", 4, 1, "MEDIUM", 90.1),
            _mk_lap("HAM", 5, 1, "MEDIUM", 97.0),   # > 107% of stint best 90.0 -> drop
            _mk_lap("HAM", 6, 1, "MEDIUM", 90.3),
        ]
    )
    kept = extract_valid_stint_laps(laps)
    assert 5 not in {k.lap_number for k in kept}
    assert len(kept) == 4


def test_stint_lap_indexing_is_one_indexed_per_stint():
    laps = pd.DataFrame(
        [
            _mk_lap("VER", 2, 1, "MEDIUM", 90.0),
            _mk_lap("VER", 3, 1, "MEDIUM", 90.1),
            _mk_lap("VER", 7, 2, "HARD", 91.0),
            _mk_lap("VER", 8, 2, "HARD", 91.1),
        ]
    )
    kept = extract_valid_stint_laps(laps)
    by_stint = {(k.driver, k.stint): k.stint_lap for k in kept if k.lap_number in {2, 7}}
    assert by_stint[("VER", 1)] == 1
    assert by_stint[("VER", 2)] == 1


@pytest.mark.parametrize("missing_col", ["Driver", "LapNumber", "Stint", "Compound", "LapTime"])
def test_rejects_missing_required_columns(missing_col: str):
    laps = pd.DataFrame([_mk_lap("VER", 2, 1, "MEDIUM", 90.0)])
    laps = laps.drop(columns=[missing_col])
    with pytest.raises(ValueError, match=missing_col):
        extract_valid_stint_laps(laps)
