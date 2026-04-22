"""Cross-cutting middleware: CORS, request ID, error envelope, request log line."""

import os
import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

REQUEST_ID_HEADER = "X-Request-ID"
REQUEST_ID_ATTR = "request_id"


def _parse_allowed_origins() -> list[str]:
    raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


def _status_to_code(status: int) -> str:
    if status == 400:
        return "BAD_REQUEST"
    if status == 404:
        return "NOT_FOUND"
    if status == 422:
        return "VALIDATION_ERROR"
    if status >= 500:
        return "INTERNAL_ERROR"
    return "ERROR"


async def _request_id_and_log_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[JSONResponse]],
) -> JSONResponse:
    rid = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex[:12]
    setattr(request.state, REQUEST_ID_ATTR, rid)
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        logger.bind(
            request_id=rid, method=request.method, path=request.url.path,
            status=500, duration_ms=elapsed_ms,
        ).exception("unhandled request error")
        raise
    elapsed_ms = int((time.perf_counter() - start) * 1000)
    response.headers[REQUEST_ID_HEADER] = rid
    logger.bind(
        request_id=rid, method=request.method, path=request.url.path,
        status=response.status_code, duration_ms=elapsed_ms,
    ).info("request")
    return response


async def _http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    rid = getattr(request.state, REQUEST_ID_ATTR, "-")
    return JSONResponse(
        status_code=exc.status_code,
        headers={REQUEST_ID_HEADER: rid},
        content={
            "error": {
                "code": _status_to_code(exc.status_code),
                "message": str(exc.detail),
                "request_id": rid,
            }
        },
    )


async def _validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    rid = getattr(request.state, REQUEST_ID_ATTR, "-")
    return JSONResponse(
        status_code=422,
        headers={REQUEST_ID_HEADER: rid},
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(exc.errors()),
                "request_id": rid,
            }
        },
    )


def install_middleware(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_parse_allowed_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    app.middleware("http")(_request_id_and_log_middleware)
    # FastAPI's add_exception_handler types the handler loosely vs our exact signatures
    app.add_exception_handler(HTTPException, _http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)  # type: ignore[arg-type]
