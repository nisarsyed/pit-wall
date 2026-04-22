from fastapi.testclient import TestClient

from pit_wall.main import app


def test_health_still_works():
    with TestClient(app) as client:
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert "version" in body


def test_list_races_returns_three_curated_races():
    with TestClient(app) as client:
        r = client.get("/races")
        assert r.status_code == 200
        races = r.json()
        assert isinstance(races, list)
        ids = {race["id"] for race in races}
        assert ids == {"2023_bahrain", "2023_hungary", "2024_british"}
        for race in races:
            assert "name" in race
            assert "year" in race
            assert "total_laps" in race and race["total_laps"] > 0
            assert "compounds_available" in race
            assert isinstance(race["compounds_available"], list)
            # committed artifact has actual_winner on every race
            assert race["actual_winner_name"] is not None
            assert race["actual_winning_time_s"] is not None


def test_race_detail_returns_curves_and_winner():
    with TestClient(app) as client:
        r = client.get("/races/2023_bahrain")
        assert r.status_code == 200
        body = r.json()
        assert body["id"] == "2023_bahrain"
        assert body["total_laps"] == 57
        assert "compounds" in body
        assert set(body["compounds"].keys()) >= {"HARD", "SOFT"}
        for curve in body["compounds"].values():
            assert "slope" in curve and "intercept" in curve
            assert "valid_stint_range" in curve
        winner = body["actual_winner"]
        assert winner is not None
        assert winner["name"] == "Max Verstappen"
        assert len(winner["strategy"]) >= 1


def test_race_detail_404_on_unknown_id():
    with TestClient(app) as client:
        r = client.get("/races/not_a_real_race")
        assert r.status_code == 404
