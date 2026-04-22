"""Filter a FastF1 laps DataFrame down to valid race-pace laps per stint."""

from dataclasses import dataclass

import pandas as pd

REQUIRED_COLUMNS = ("Driver", "LapNumber", "Stint", "Compound", "LapTime")
TRAFFIC_CUTOFF_RATIO = 1.07


@dataclass(frozen=True)
class CompoundStintLap:
    driver: str
    stint: int
    compound: str
    lap_number: int
    stint_lap: int          # 1-indexed position within the stint
    lap_time_s: float


def extract_valid_stint_laps(laps: pd.DataFrame) -> list[CompoundStintLap]:
    missing = [c for c in REQUIRED_COLUMNS if c not in laps.columns]
    if missing:
        raise ValueError(f"laps missing required columns: {missing}")

    df = laps.copy()

    # Filter 1: drop lap 1 (rolling start / start chaos)
    df = df[df["LapNumber"] > 1]

    # Filter 2: drop laps where FastF1 has flagged the lap time as unreliable
    if "IsAccurate" in df.columns:
        df = df[df["IsAccurate"].astype(bool)]

    # Filter 3: drop laps under SC/VSC.
    # TrackStatus is a string like "1" (green), "2" (yellow), "4" (SC), "6"/"7" (VSC).
    # Any status other than "1" is treated as compromised.
    if "TrackStatus" in df.columns:
        df = df[df["TrackStatus"].astype(str) == "1"]

    # Filter 4: drop in-laps (PitInTime set) and out-laps (PitOutTime set).
    if "PitInTime" in df.columns:
        df = df[df["PitInTime"].isna()]
    if "PitOutTime" in df.columns:
        df = df[df["PitOutTime"].isna()]

    # Filter 5: drop rows with no LapTime (retirements etc.)
    df = df[df["LapTime"].notna()]
    df = df[df["Compound"].notna()]

    # Compute per-stint best and drop > 107% of it (traffic proxy).
    # Use non-underscore-prefixed column names to avoid itertuples positional renaming.
    df = df.assign(lap_s_internal=df["LapTime"].dt.total_seconds())
    df = df.assign(
        stint_best_internal=df.groupby(["Driver", "Stint"])["lap_s_internal"].transform("min")
    )
    df = df[df["lap_s_internal"] <= df["stint_best_internal"] * TRAFFIC_CUTOFF_RATIO]

    # Assign stint_lap = actual position within the stint (1-indexed).
    # Computed from LapNumber - stint_start_lap + 1 (NOT a cumcount of survivors),
    # so that filtered interior laps create a gap in stint_lap values that matches
    # the simulator's x-axis exactly (see spec §7.1).
    df = df.sort_values(["Driver", "Stint", "LapNumber"])
    df = df.assign(
        _stint_start_lap=df.groupby(["Driver", "Stint"])["LapNumber"].transform("min"),
    )
    df = df.assign(
        _stint_lap=df["LapNumber"] - df["_stint_start_lap"] + 1,
    )

    # Filter 6: drop the first lap on each stint (stint_lap == 1).
    # This is the tyre warm-up lap; including it biases the degradation slope
    # negative on short stints because tyres are not yet at working temperature.
    df = df[df["_stint_lap"] > 1]

    out: list[CompoundStintLap] = []
    records = df[
        ["Driver", "Stint", "Compound", "LapNumber", "_stint_lap", "lap_s_internal"]
    ].to_dict("records")
    for rec in records:
        out.append(
            CompoundStintLap(
                driver=str(rec["Driver"]),
                stint=int(rec["Stint"]),
                compound=str(rec["Compound"]).upper(),
                lap_number=int(rec["LapNumber"]),
                stint_lap=int(rec["_stint_lap"]),
                lap_time_s=float(rec["lap_s_internal"]),
            )
        )
    return out
