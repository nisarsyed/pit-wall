"""Race manifest loader: reads manifest.yaml and validates via pydantic."""

from pathlib import Path

import yaml
from pydantic import BaseModel, ValidationError


class Race(BaseModel):
    model_config = {"frozen": True}

    id: str
    name: str
    country: str
    year: int
    round: int
    session: str
    pit_loss_s: float


class _ManifestFile(BaseModel):
    races: list[Race]


def load_manifest(path: Path) -> list[Race]:
    if not path.exists():
        raise FileNotFoundError(path)
    raw: dict[str, object] = yaml.safe_load(path.read_text())
    try:
        return _ManifestFile.model_validate(raw).races
    except ValidationError as exc:
        raise ValueError(f"invalid manifest: {exc}") from exc
