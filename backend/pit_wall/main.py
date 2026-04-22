from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from importlib.metadata import version

from fastapi import FastAPI

from pit_wall.api.routes import router
from pit_wall.data.curves import load_curves


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.curves = load_curves()
    yield


app = FastAPI(title="Pit Wall API", version=version("pit-wall"), lifespan=lifespan)
app.include_router(router)
