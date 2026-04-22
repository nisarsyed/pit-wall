"""Linear least-squares fit: pace_delta_vs_base = slope * stint_lap + intercept."""

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

MIN_POINTS_FOR_FIT = 5


@dataclass(frozen=True)
class CompoundFit:
    slope: float
    intercept: float
    r2: float
    valid_stint_range: tuple[int, int]

    def to_dict(self) -> dict[str, float | list[int]]:
        return {
            "slope": float(self.slope),
            "intercept": float(self.intercept),
            "r2": float(self.r2),
            "valid_stint_range": [
                int(self.valid_stint_range[0]),
                int(self.valid_stint_range[1]),
            ],
        }


def fit_compound(
    stint_laps: NDArray[np.int_] | NDArray[np.float64],
    pace_delta: NDArray[np.float64],
) -> CompoundFit:
    if len(stint_laps) < MIN_POINTS_FOR_FIT:
        raise ValueError(
            f"need at least {MIN_POINTS_FOR_FIT} points to fit; got {len(stint_laps)}"
        )
    x = np.asarray(stint_laps, dtype=np.float64)
    y = np.asarray(pace_delta, dtype=np.float64)

    slope, intercept = (float(c) for c in np.polyfit(x, y, deg=1))

    y_pred = slope * x + intercept
    ss_res = float(np.sum((y - y_pred) ** 2))
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    # If ss_tot == 0 (all y values identical), the fit is "perfect" iff residuals are also 0.
    # Otherwise r2 is undefined; return 0.0.
    if ss_tot > 0:
        r2 = 1.0 - ss_res / ss_tot
    else:
        r2 = 1.0 if ss_res == 0 else 0.0

    return CompoundFit(
        slope=float(slope),
        intercept=float(intercept),
        r2=r2,
        valid_stint_range=(int(x.min()), int(x.max())),
    )


def fit_compound_from_stints(
    stints: list[list[tuple[int, float]]],
) -> CompoundFit:
    """stints: list of stints, each a list of (stint_lap, pace_delta) tuples."""
    flat: list[tuple[int, float]] = []
    for stint in stints:
        flat.extend(stint)
    if not flat:
        raise ValueError("no stint data provided")

    xs = np.array([p[0] for p in flat], dtype=np.float64)
    ys = np.array([p[1] for p in flat], dtype=np.float64)
    return fit_compound(xs, ys)
