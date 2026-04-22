"""Orchestrate: fastf1 laps → fuel-correct → fit → curves.json entry."""

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from pipeline.fit import fit_compound_from_stints
from pipeline.fuel import fuel_correct_lap_time
from pipeline.ingest import CompoundStintLap, extract_valid_stint_laps
from pipeline.manifest import Race, load_manifest

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class RaceBuildInput:
    race: Race
    total_laps: int
    laps: pd.DataFrame
    actual_winner: dict[str, Any] | None = None


def build_curves_for_race(inp: RaceBuildInput) -> dict[str, Any]:
    valid_laps = extract_valid_stint_laps(inp.laps)
    if not valid_laps:
        raise ValueError(f"no valid laps after filtering for race {inp.race.id}")

    # Fuel-correct each lap time.
    corrected: list[tuple[CompoundStintLap, float]] = [
        (lap, fuel_correct_lap_time(lap.lap_time_s, lap.lap_number, inp.total_laps))
        for lap in valid_laps
    ]

    # Base = mean of each driver's fuel-corrected fastest valid lap.
    best_per_driver: dict[str, float] = {}
    for lap, corrected_s in corrected:
        prev = best_per_driver.get(lap.driver)
        if prev is None or corrected_s < prev:
            best_per_driver[lap.driver] = corrected_s
    base = sum(best_per_driver.values()) / len(best_per_driver)

    # Per-compound: build stint -> list of (stint_lap, pace_delta_vs_base) tuples.
    per_compound: dict[str, dict[tuple[str, int], list[tuple[int, float]]]] = {}
    for lap, corrected_s in corrected:
        delta = corrected_s - base
        per_compound.setdefault(lap.compound, {}).setdefault(
            (lap.driver, lap.stint), []
        ).append((lap.stint_lap, delta))

    compounds: dict[str, dict[str, Any]] = {}
    for compound, stints_map in per_compound.items():
        stints = list(stints_map.values())
        try:
            fit = fit_compound_from_stints(stints)
        except ValueError as exc:
            raise ValueError(
                f"race {inp.race.id}: compound {compound}: {exc}"
            ) from exc
        compounds[compound] = fit.to_dict()

    if len(compounds) < 2:
        raise ValueError(
            f"race {inp.race.id}: only {len(compounds)} compound(s) fitted; "
            f"spec requires at least 2 distinct compounds per race"
        )

    out: dict[str, Any] = {
        "name": inp.race.name,
        "country": inp.race.country,
        "year": inp.race.year,
        "total_laps": inp.total_laps,
        "base_lap_time_s": float(base),
        "pit_loss_s": inp.race.pit_loss_s,
        "compounds": compounds,
    }
    if inp.actual_winner is not None:
        out["actual_winner"] = inp.actual_winner
    return out


def _load_fastf1_session(race: Race) -> tuple[int, pd.DataFrame, dict[str, Any]]:
    """Fetch a real race session via FastF1. Returns total_laps, all laps, and winner's result."""
    import fastf1  # local import: heavy + optional at test time

    fastf1.Cache.enable_cache(".fastf1-cache")
    session = fastf1.get_session(race.year, race.round, race.session)
    session.load(laps=True, telemetry=False, weather=False, messages=False)

    total_laps = int(session.laps["LapNumber"].max())

    # Session results DataFrame: indexed by driver abbreviation, has columns like
    # FullName, Position, Time, Points. Winner = row with Position == 1.
    results = session.results
    winner_row = results[results["Position"] == 1].iloc[0]
    winner_abbr = str(winner_row.name)  # index is the 3-letter code
    winner_name = str(winner_row["FullName"])

    # Winner's lap data → reconstruct strategy (list of {compound, start_lap} per stint)
    winner_laps = session.laps[session.laps["Driver"] == winner_abbr].sort_values("LapNumber")
    strategy: list[dict[str, Any]] = []
    for stint in winner_laps["Stint"].dropna().unique():
        stint_laps = winner_laps[winner_laps["Stint"] == stint]
        compound_vals = stint_laps["Compound"].dropna().unique()
        if len(compound_vals) == 0:
            continue
        start_lap = int(stint_laps["LapNumber"].min())
        strategy.append({
            "compound": str(compound_vals[0]).upper(),
            "start_lap": start_lap,
        })
    strategy.sort(key=lambda s: s["start_lap"])

    # Total time: results["Time"] for winner is a Timedelta from session start
    winner_time = winner_row["Time"]
    total_time_s = float(winner_time.total_seconds()) if pd.notna(winner_time) else 0.0

    actual_winner = {
        "name": winner_name,
        "strategy": strategy,
        "total_time_s": total_time_s,
    }
    return total_laps, session.laps, actual_winner


def build_all(manifest_path: Path, output_path: Path) -> dict[str, Any]:
    races = load_manifest(manifest_path)
    out: dict[str, Any] = {}
    for race in races:
        log.info("building race %s", race.id)
        total_laps, laps, actual_winner = _load_fastf1_session(race)
        out[race.id] = build_curves_for_race(
            RaceBuildInput(
                race=race,
                total_laps=total_laps,
                laps=laps,
                actual_winner=actual_winner,
            )
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(out, indent=2, sort_keys=True))
    return out


if __name__ == "__main__":
    import argparse

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path(__file__).parent / "manifest.yaml",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=(
            Path(__file__).resolve().parents[2] / "backend" / "pit_wall" / "data" / "curves.json"
        ),
    )
    args = parser.parse_args()
    build_all(args.manifest, args.out)
    log.info("wrote %s", args.out)
