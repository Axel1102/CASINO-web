"""Same-origin public site: static frontend and four read-only API routes."""

import json
import os
import re
from pathlib import Path

from starlette.applications import Starlette
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

from lab_backend.application import public_app


def create_app():
    api = public_app()
    root = Path(os.environ.get("CASINO_DIST", Path(__file__).resolve().parents[1] / "dist"))
    snapshot = json.loads((root / "data/lab.json").read_text(encoding="utf-8"))
    site = {key: snapshot[key] for key in ("schemaVersion", "assets", "siteSettings", "news", "researchAreas", "opportunities")}

    async def mode(request):
        return Response("export const apiMode = true;\n", media_type="text/javascript",
                        headers={"Cache-Control": "no-store"})

    async def settings(request):
        return JSONResponse(site, headers={"Cache-Control": "no-store"})

    async def missing(scope, receive, send):
        await Response(status_code=404)(scope, receive, send)

    async def dispatch(scope, receive, send):
        path = scope["path"]
        if not re.fullmatch(r"/api/(?:home|publications|people(?:/[A-Za-z0-9][A-Za-z0-9_-]{0,199})?)", path):
            return await Response(status_code=404)(scope, receive, send)
        if scope["method"] != "GET":
            return await Response(status_code=405, headers={"Allow": "GET"})(scope, receive, send)
        upstream = "/api/v1/public" + path.removeprefix("/api")
        headers = [(k, v) for k, v in scope["headers"] if k.lower() not in (b"authorization", b"cookie")]
        await api({**scope, "root_path": "", "path": upstream, "raw_path": upstream.encode(),
                   "headers": headers}, receive, send)

    return Starlette(routes=[
        Route("/api-mode.js", mode),
        Route("/data/site.json", settings),
        Mount("/data", app=missing),
        Mount("/api", app=dispatch),
        Mount("/", app=StaticFiles(directory=root, html=True)),
    ], lifespan=lambda _: api.router.lifespan_context(api))
