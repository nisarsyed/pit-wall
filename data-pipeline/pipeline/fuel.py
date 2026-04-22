"""Linear fuel-burn model for separating tyre pace from fuel weight."""

INITIAL_FUEL_KG = 110.0
FUEL_PENALTY_S_PER_KG = 0.035


def fuel_kg_remaining(lap: int, total_laps: int) -> float:
    if total_laps < 2:
        raise ValueError("total_laps must be >= 2")
    if lap < 1 or lap > total_laps:
        raise ValueError(f"lap {lap} out of range [1, {total_laps}]")
    progress = (lap - 1) / (total_laps - 1)
    return INITIAL_FUEL_KG * (1.0 - progress)


def fuel_correct_lap_time(observed_s: float, lap: int, total_laps: int) -> float:
    penalty = fuel_kg_remaining(lap, total_laps) * FUEL_PENALTY_S_PER_KG
    return observed_s - penalty
