"""Configure loguru to emit single-line JSON to stdout.

Fly.io captures stdout/stderr into its log drain, and structured logs make
grepping the drain for request IDs trivial.
"""

import json
import sys
from typing import Any

from loguru import logger


def _json_sink(message: Any) -> None:
    record = message.record
    payload = {
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        **record["extra"],
    }
    sys.stdout.write(json.dumps(payload) + "\n")


def configure_logging() -> None:
    logger.remove()
    logger.add(_json_sink, level="INFO")
