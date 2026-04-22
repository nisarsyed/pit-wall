from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from importlib.metadata import version

from fastapi import FastAPI

from pit_wall.api.middleware import install_middleware
from pit_wall.api.routes import router
from pit_wall.data.curves import load_curves
from pit_wall.logging_config import configure_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.curves = load_curves()
    yield


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="Pit Wall API", version=version("pit-wall"), lifespan=lifespan)
    install_middleware(app)
    app.include_router(router)
    return app


app = create_app()
