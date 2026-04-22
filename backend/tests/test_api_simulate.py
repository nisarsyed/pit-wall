from fastapi.testclient import TestClient

from pit_wall.main import app


def _post_simulate(client: TestClient, race_id: str, stints: list[dict]) -> dict:
    r = client.post(f"/races/{race_id}/simulate", json={"stints": stints})
    return {"status": r.status_code, "body": r.json() if r.content else None}


def test_simulate_happy_path_returns_lap_times_and_total():
    strat = [
        {"compound": "MEDIUM", "start_lap": 1},
        {"compound": "HARD",   "start_lap": 25},
    ]
    with TestClient(app) as client:
        resp = _post_simulate(client, "2023_bahrain", strat)
    assert resp["status"] == 200
    body = resp["body"]
    assert len(body["lap_times"]) == 57            # Bahrain total_laps
    assert len(body["cumulative_times"]) == 57
    assert body["total_time_s"] > 0
    assert body["total_time_vs_actual_s"] is not None  # Bahrain artifact has actual_winner
    assert isinstance(body["warnings"], list)


def test_simulate_returns_400_on_single_compound():
    strat = [
        {"compound": "MEDIUM", "start_lap": 1},
        {"compound": "MEDIUM", "start_lap": 25},
    ]
    with TestClient(app) as client:
        resp = _post_simulate(client, "2023_bahrain", strat)
    assert resp["status"] == 400
    # The error envelope is NOT yet installed (that's Task 3.7) — the body is FastAPI's
    # default `{"detail": "..."}`. Assert on the message substring regardless of wrapping.
    msg = resp["body"].get("detail") or resp["body"].get("error", {}).get("message", "")
    assert "2 distinct compounds" in msg


def test_simulate_returns_400_on_first_stint_not_lap_1():
    strat = [
        {"compound": "MEDIUM", "start_lap": 2},
        {"compound": "HARD",   "start_lap": 25},
    ]
    with TestClient(app) as client:
        resp = _post_simulate(client, "2023_bahrain", strat)
    assert resp["status"] == 400


def test_simulate_returns_400_on_unknown_compound():
    strat = [
        {"compound": "SUPERSOFT", "start_lap": 1},
        {"compound": "HARD",      "start_lap": 25},
    ]
    with TestClient(app) as client:
        resp = _post_simulate(client, "2023_bahrain", strat)
    assert resp["status"] == 400
    msg = resp["body"].get("detail") or resp["body"].get("error", {}).get("message", "")
    assert "SUPERSOFT" in msg


def test_simulate_returns_400_on_overlapping_stints():
    strat = [
        {"compound": "MEDIUM", "start_lap": 1},
        {"compound": "HARD",   "start_lap": 25},
        {"compound": "SOFT",   "start_lap": 25},
    ]
    with TestClient(app) as client:
        resp = _post_simulate(client, "2023_bahrain", strat)
    assert resp["status"] == 400


def test_simulate_returns_400_on_pit_lap_out_of_range():
    strat = [
        {"compound": "MEDIUM", "start_lap": 1},
        {"compound": "HARD",   "start_lap": 57},   # == total_laps of Bahrain
    ]
    with TestClient(app) as client:
        resp = _post_simulate(client, "2023_bahrain", strat)
    assert resp["status"] == 400


def test_simulate_returns_404_on_unknown_race():
    strat = [
        {"compound": "MEDIUM", "start_lap": 1},
        {"compound": "HARD",   "start_lap": 25},
    ]
    with TestClient(app) as client:
        resp = _post_simulate(client, "not_a_real_race", strat)
    assert resp["status"] == 404


def test_simulate_returns_warning_on_extrapolated_stint():
    # Bahrain 2023 has total_laps=57. Using SOFT for a 49-lap stint extrapolates past
    # its fitted valid_stint_range upper bound (real value is typically ~20).
    strat = [
        {"compound": "SOFT",   "start_lap": 1},
        {"compound": "MEDIUM", "start_lap": 50},
    ]
    with TestClient(app) as client:
        resp = _post_simulate(client, "2023_bahrain", strat)
    assert resp["status"] == 200
    assert any("SOFT" in w and "extrapolated" in w for w in resp["body"]["warnings"])


def test_simulate_rejects_empty_stints():
    with TestClient(app) as client:
        r = client.post("/races/2023_bahrain/simulate", json={"stints": []})
    # Pydantic min_length=1 catches this as a 422 validation error.
    # After Task 3.7 installs the envelope+handler, both 400 and 422 remain acceptable.
    assert r.status_code in (400, 422)


def test_extrapolated_long_stint_delta_is_positive():
    # Hungary 1-stop with a 54-lap SOFT (valid_stint_range 2-13). Pre-cliff the
    # model returned a physically impossible -36s delta because the near-flat
    # SOFT fit (r²≈0.02) didn't penalise over-run. Post-cliff, the stint pays
    # 0.25s × excess per lap, which more than erases the ~21s saved from
    # skipping a pit stop.
    strat = [
        {"compound": "MEDIUM", "start_lap": 1},
        {"compound": "SOFT",   "start_lap": 17},
    ]
    with TestClient(app) as client:
        resp = _post_simulate(client, "2023_hungary", strat)
    assert resp["status"] == 200
    body = resp["body"]
    assert body["total_time_vs_actual_s"] > 0, (
        f"Expected positive delta for 54-lap SOFT stint, got {body['total_time_vs_actual_s']}"
    )
    assert any("extrapolated" in w for w in body["warnings"])
