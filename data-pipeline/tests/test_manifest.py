from pathlib import Path

import pytest

from pipeline.manifest import Race, load_manifest

FIXTURE = """
races:
  - id: "2023_test"
    name: "Test Grand Prix"
    country: "Testland"
    year: 2023
    round: 1
    session: "R"
    pit_loss_s: 22.0
"""


def test_load_manifest_parses_single_race(tmp_path: Path):
    path = tmp_path / "manifest.yaml"
    path.write_text(FIXTURE)

    races = load_manifest(path)

    assert len(races) == 1
    assert races[0] == Race(
        id="2023_test",
        name="Test Grand Prix",
        country="Testland",
        year=2023,
        round=1,
        session="R",
        pit_loss_s=22.0,
    )


def test_load_manifest_rejects_missing_file(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        load_manifest(tmp_path / "nope.yaml")


def test_load_manifest_rejects_bad_schema(tmp_path: Path):
    path = tmp_path / "manifest.yaml"
    path.write_text("races:\n  - id: only-id\n")
    with pytest.raises(ValueError):
        load_manifest(path)


def test_real_manifest_has_three_races():
    real = Path(__file__).parent.parent / "pipeline" / "manifest.yaml"
    races = load_manifest(real)
    ids = {r.id for r in races}
    assert ids == {"2023_bahrain", "2023_hungary", "2024_british"}
