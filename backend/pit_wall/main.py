from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from importlib.metadata import version

from fastapi import FastAPI

from pit_wall.data.curves import load_curves


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # app.state is untyped (starlette State); attribute assignment is accepted by mypy
    # without narrowing. Annotate at the point of use rather than here.
    app.state.curves = load_curves()
    yield


app = FastAPI(title="Pit Wall API", version=version("pit-wall"), lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": app.version}
