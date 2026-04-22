import json
from pathlib import Path

import pytest

from pit_wall.data.curves import ActualWinner, RaceCurves, StrategyStint, load_curves

FIXTURE = {
    "2023_test": {
        "name": "Test GP",
        "country": "Testland",
        "year": 2023,
        "total_laps": 50,
        "base_lap_time_s": 90.0,
        "pit_loss_s": 22.0,
        "compounds": {
            "MEDIUM": {"slope": 0.05, "intercept": 0.1, "r2": 0.8, "valid_stint_range": [1, 25]},
            "HARD":   {"slope": 0.04, "intercept": 0.2, "r2": 0.75, "valid_stint_range": [1, 35]},
        },
        "actual_winner": {
            "name": "Max Verstappen",
            "strategy": [
                {"compound": "SOFT",   "start_lap": 1},
                {"compound": "MEDIUM", "start_lap": 18},
            ],
            "total_time_s": 5543.27,
        },
    }
}


def test_load_curves_parses_fixture(tmp_path: Path):
    path = tmp_path / "curves.json"
    path.write_text(json.dumps(FIXTURE))

    loaded = load_curves(path)

    assert set(loaded.keys()) == {"2023_test"}
    race = loaded["2023_test"]
    assert isinstance(race, RaceCurves)
    assert race.total_laps == 50
    assert race.pit_loss_s == 22.0
    assert set(race.compounds.keys()) == {"MEDIUM", "HARD"}
    medium = race.compounds["MEDIUM"]
    assert medium.slope == 0.05
    assert medium.valid_stint_range == (1, 25)

    assert race.actual_winner is not None
    assert isinstance(race.actual_winner, ActualWinner)
    assert race.actual_winner.name == "Max Verstappen"
    assert len(race.actual_winner.strategy) == 2
    assert isinstance(race.actual_winner.strategy[0], StrategyStint)
    assert race.actual_winner.strategy[0].compound == "SOFT"
    assert race.actual_winner.strategy[0].start_lap == 1


def test_load_curves_allows_missing_actual_winner(tmp_path: Path):
    fixture = {
        "2023_nowinner": {
            "name": "X", "country": "X", "year": 2023, "total_laps": 50,
            "base_lap_time_s": 90.0, "pit_loss_s": 22.0,
            "compounds": {
                "MEDIUM": {
                    "slope": 0.05, "intercept": 0.1, "r2": 0.8, "valid_stint_range": [1, 25]
                },
                "HARD": {
                    "slope": 0.04, "intercept": 0.2, "r2": 0.75, "valid_stint_range": [1, 35]
                },
            },
        }
    }
    path = tmp_path / "curves.json"
    path.write_text(json.dumps(fixture))

    loaded = load_curves(path)
    assert loaded["2023_nowinner"].actual_winner is None


def test_load_curves_rejects_missing_compound_field(tmp_path: Path):
    bad = {
        "2023_test": {
            "name": "X", "country": "X", "year": 2023, "total_laps": 50,
            "base_lap_time_s": 90.0, "pit_loss_s": 22.0,
            # missing valid_stint_range
            "compounds": {"MEDIUM": {"slope": 0.05, "intercept": 0.1, "r2": 0.8}},
        }
    }
    path = tmp_path / "curves.json"
    path.write_text(json.dumps(bad))
    with pytest.raises(ValueError):
        load_curves(path)


def test_load_curves_rejects_missing_file(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        load_curves(tmp_path / "nope.json")


def test_load_real_curves_from_repo():
    """The committed artifact must always be loadable by the backend."""
    real = Path(__file__).parent.parent / "pit_wall" / "data" / "curves.json"
    if not real.exists():
        pytest.skip("curves.json not yet built")
    races = load_curves(real)
    assert len(races) >= 1
    for race_id, race in races.items():
        assert race.total_laps > 0
        assert race.compounds
        # Winner data is present on the committed artifact.
        assert race.actual_winner is not None, f"{race_id}: actual_winner missing"
        assert race.actual_winner.name
        assert len(race.actual_winner.strategy) >= 1
