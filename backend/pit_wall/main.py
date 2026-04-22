from importlib.metadata import version

from fastapi import FastAPI

app = FastAPI(title="Pit Wall API", version=version("pit-wall"))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": app.version}
