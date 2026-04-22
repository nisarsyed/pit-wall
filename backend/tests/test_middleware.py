from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient]:
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://example.com,https://preview.example.com")
    # Re-import app so env var takes effect.
    import importlib

    import pit_wall.main as main
    importlib.reload(main)
    # Use context manager so the lifespan (load_curves) runs before any request.
    with TestClient(main.app) as tc:
        yield tc


def test_response_has_request_id_header(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    assert "x-request-id" in {k.lower() for k in r.headers}
    req_id = r.headers.get("X-Request-ID")
    assert req_id and len(req_id) >= 8


def test_cors_preflight_allows_configured_origin(client: TestClient):
    r = client.options(
        "/races",
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert r.status_code in (200, 204)
    assert r.headers.get("access-control-allow-origin") == "https://example.com"


def test_cors_blocks_unlisted_origin(client: TestClient):
    r = client.get("/health", headers={"Origin": "https://evil.example"})
    # FastAPI/starlette CORSMiddleware still returns 200 but omits the
    # Access-Control-Allow-Origin header for unlisted origins.
    assert "evil.example" not in r.headers.get("access-control-allow-origin", "")


def test_http_exception_wrapped_in_error_envelope(client: TestClient):
    r = client.get("/races/nope")
    assert r.status_code == 404
    body = r.json()
    assert "error" in body
    assert body["error"]["code"] == "NOT_FOUND"
    assert "nope" in body["error"]["message"]
    assert body["error"]["request_id"]
    # request_id in header matches body
    assert body["error"]["request_id"] == r.headers.get("X-Request-ID")


def test_400_also_wrapped(client: TestClient):
    r = client.post(
        "/races/2023_bahrain/simulate",
        json={"stints": [{"compound": "MEDIUM", "start_lap": 1}]},
    )
    assert r.status_code == 400
    body = r.json()
    assert body["error"]["code"] == "BAD_REQUEST"
    assert body["error"]["request_id"]
