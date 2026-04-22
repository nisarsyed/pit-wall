"""HTTP routes for the Pit Wall API."""

from fastapi import APIRouter, HTTPException, Request

from pit_wall.api.schemas import (
    ActualWinnerOut,
    CompoundCurveOut,
    HealthResponse,
    RaceDetail,
    RaceListItem,
    StrategyStintOut,
)
from pit_wall.data.curves import RaceCurves

router = APIRouter()


def _get_curves(request: Request) -> dict[str, RaceCurves]:
    curves: dict[str, RaceCurves] | None = getattr(request.app.state, "curves", None)
    if curves is None:
        raise HTTPException(status_code=500, detail="curves not loaded")
    return curves


@router.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    return HealthResponse(status="ok", version=request.app.version)


@router.get("/races", response_model=list[RaceListItem])
def list_races(request: Request) -> list[RaceListItem]:
    curves = _get_curves(request)
    out: list[RaceListItem] = []
    for race_id, race in curves.items():
        out.append(
            RaceListItem(
                id=race_id,
                name=race.name,
                country=race.country,
                year=race.year,
                total_laps=race.total_laps,
                compounds_available=sorted(race.compounds.keys()),
                actual_winner_name=race.actual_winner.name if race.actual_winner else None,
                actual_winning_time_s=(
                    race.actual_winner.total_time_s if race.actual_winner else None
                ),
            )
        )
    return out


@router.get("/races/{race_id}", response_model=RaceDetail)
def race_detail(race_id: str, request: Request) -> RaceDetail:
    curves = _get_curves(request)
    race = curves.get(race_id)
    if race is None:
        raise HTTPException(status_code=404, detail=f"race '{race_id}' not found")
    return RaceDetail(
        id=race_id,
        name=race.name,
        country=race.country,
        year=race.year,
        total_laps=race.total_laps,
        base_lap_time_s=race.base_lap_time_s,
        pit_loss_s=race.pit_loss_s,
        compounds={
            name: CompoundCurveOut(
                slope=c.slope,
                intercept=c.intercept,
                r2=c.r2,
                valid_stint_range=c.valid_stint_range,
            )
            for name, c in race.compounds.items()
        },
        actual_winner=(
            ActualWinnerOut(
                name=race.actual_winner.name,
                strategy=[
                    StrategyStintOut(compound=s.compound, start_lap=s.start_lap)
                    for s in race.actual_winner.strategy
                ],
                total_time_s=race.actual_winner.total_time_s,
            )
            if race.actual_winner
            else None
        ),
    )
