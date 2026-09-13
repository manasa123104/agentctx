from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "web"))

from shared.runner import DEMO, run_check, run_gate, run_mcp, lint_uploaded_context  # noqa: E402

APP_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(APP_DIR / "templates"))

app = FastAPI(
    title="agentctx",
    description="Lint AI agent context files — FastAPI web UI",
    version="1.0.0",
)


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "demo_path": str(DEMO),
            "framework": "FastAPI",
        },
    )


@app.get("/api/check")
async def api_check():
    return run_check()


@app.get("/api/mcp")
async def api_mcp():
    return run_mcp()


@app.get("/api/gate")
async def api_gate():
    return run_gate()


@app.post("/run", response_class=HTMLResponse)
async def run_action(request: Request, action: str = Form("check")):
    runners = {
        "check": run_check,
        "mcp": run_mcp,
        "gate": run_gate,
    }
    result = runners.get(action, run_check)()
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "demo_path": str(DEMO),
            "framework": "FastAPI",
            "action": action,
            "result": result,
        },
    )


@app.post("/lint", response_class=HTMLResponse)
async def lint_form(
    request: Request,
    agents_md: str = Form(""),
    mcp_json: str = Form(""),
):
    result = lint_uploaded_context(agents_md, mcp_json or None)
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "demo_path": str(DEMO),
            "framework": "FastAPI",
            "action": "custom",
            "custom_result": result,
            "agents_md": agents_md,
            "mcp_json": mcp_json,
        },
    )
