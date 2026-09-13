from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "web"))

from shared.catalog import (  # noqa: E402
    CONTEXT_RULES,
    MCP_RULES,
    NAV,
    SAMPLE_AGENTS_BAD,
    SAMPLE_AGENTS_GOOD,
    SAMPLE_MCP_BAD,
    SAMPLE_MCP_GOOD,
)
from shared.explain import RULE_HELP, analyze_mcp_text, friendly_report  # noqa: E402
from shared.runner import (  # noqa: E402
    DEMO,
    DEMO_GOOD,
    build_report,
    lint_uploaded_context,
    run_check,
    run_gate,
    run_init_preview,
    run_mcp,
)

RANDOM_AGENTS = "asdfgh qwerty hello world !!!@@@\nzzzzzz"
RANDOM_MCP = "this is not json at all lol 12345"

TEMPLATES_DIR = ROOT / "web" / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

app = FastAPI(
    title="agentctx",
    description="Lint AI agent context files — FastAPI web UI",
    version="1.1.0",
)


def ctx(request: Request, active: str, **extra):
    return {
        "request": request,
        "framework": "FastAPI",
        "nav": NAV,
        "active": active,
        "run_url": "/run",
        "examples_url": "/examples",
        "mcp_lab_url": "/mcp-lab",
        "studio_url": "/studio",
        "about_url": "/about",
        "guide_url": "/guide",
        **extra,
    }


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", ctx(request, "/"))


def with_rule_help(rules):
    enriched = []
    for rule in rules:
        item = dict(rule)
        help_ = RULE_HELP.get(rule["id"], {})
        item["plain"] = help_.get("plain", "")
        item["fix"] = help_.get("fix", "")
        enriched.append(item)
    return enriched


@app.get("/guide", response_class=HTMLResponse)
async def guide(request: Request):
    return templates.TemplateResponse("guide.html", ctx(request, "/guide"))


@app.get("/rules", response_class=HTMLResponse)
async def rules(request: Request):
    return templates.TemplateResponse(
        "rules.html",
        ctx(
            request,
            "/rules",
            context_rules=with_rule_help(CONTEXT_RULES),
            mcp_rules=with_rule_help(MCP_RULES),
        ),
    )


@app.get("/examples", response_class=HTMLResponse)
async def examples_get(request: Request):
    return templates.TemplateResponse("examples.html", ctx(request, "/examples"))


@app.post("/examples", response_class=HTMLResponse)
async def examples_post(
    request: Request,
    fixture: str = Form("bad"),
    action: str = Form("check"),
):
    target = DEMO_GOOD if fixture == "good" else DEMO
    runners = {
        "check": lambda: run_check(target, fmt="json"),
        "mcp": lambda: run_mcp(target, fmt="json"),
        "gate": lambda: run_gate(target),
    }
    result = runners.get(action, runners["check"])()
    if action != "gate":
        # attach human text too
        text = run_check(target) if action == "check" else run_mcp(target)
        result["stdout"] = text["stdout"]
    return templates.TemplateResponse(
        "examples.html",
        ctx(request, "/examples", result=result, fixture=fixture, action=action),
    )


@app.get("/mcp-lab", response_class=HTMLResponse)
async def mcp_lab_get(request: Request):
    return templates.TemplateResponse(
        "mcp_lab.html",
        ctx(request, "/mcp-lab", mcp_json=SAMPLE_MCP_BAD),
    )


@app.post("/mcp-lab", response_class=HTMLResponse)
async def mcp_lab_post(
    request: Request,
    mcp_json: str = Form(""),
    preset: str | None = Form(None),
):
    if preset == "bad":
        mcp_json = SAMPLE_MCP_BAD
    elif preset == "good":
        mcp_json = SAMPLE_MCP_GOOD
    elif preset == "random":
        mcp_json = RANDOM_MCP

    notice = analyze_mcp_text(mcp_json)
    result = None
    if notice["ok"]:
        packed = lint_uploaded_context("# MCP lab\n", mcp_json)
        result = packed["mcp"]

    return templates.TemplateResponse(
        "mcp_lab.html",
        ctx(request, "/mcp-lab", mcp_json=mcp_json, result=result, notice=notice),
    )


@app.get("/studio", response_class=HTMLResponse)
async def studio_get(request: Request):
    return templates.TemplateResponse(
        "studio.html",
        ctx(
            request,
            "/studio",
            agents_md="",
            mcp_json="",
        ),
    )


@app.post("/studio", response_class=HTMLResponse)
async def studio_post(
    request: Request,
    agents_md: str = Form(""),
    mcp_json: str = Form(""),
    preset: str | None = Form(None),
):
    if preset == "bad":
        agents_md, mcp_json = SAMPLE_AGENTS_BAD, SAMPLE_MCP_BAD
    elif preset == "good":
        agents_md, mcp_json = SAMPLE_AGENTS_GOOD, SAMPLE_MCP_GOOD
    elif preset == "random":
        agents_md, mcp_json = RANDOM_AGENTS, RANDOM_MCP

    friendly = friendly_report(agents_md, mcp_json, None, None)
    custom = None
    report = None
    if friendly["mode"] == "lint":
        custom = lint_uploaded_context(agents_md, mcp_json or None)
        report = build_report(custom["check"], custom.get("mcp"))
        friendly = friendly_report(agents_md, mcp_json, custom, report)
        report = friendly.get("report") or report

    return templates.TemplateResponse(
        "studio.html",
        ctx(
            request,
            "/studio",
            agents_md=agents_md,
            mcp_json=mcp_json,
            custom_result=custom,
            report=report,
            friendly=friendly,
        ),
    )


@app.get("/about", response_class=HTMLResponse)
async def about_get(request: Request):
    return templates.TemplateResponse("about.html", ctx(request, "/about"))


@app.post("/about", response_class=HTMLResponse)
async def about_post(request: Request, action: str = Form("init")):
    result = run_init_preview() if action == "init" else None
    return templates.TemplateResponse("about.html", ctx(request, "/about", result=result))


@app.get("/api/check")
async def api_check():
    return run_check(fmt="json")


@app.get("/api/mcp")
async def api_mcp():
    return run_mcp(fmt="json")


@app.get("/api/gate")
async def api_gate():
    return run_gate()


@app.get("/api/rules")
async def api_rules():
    return JSONResponse({"context": CONTEXT_RULES, "mcp": MCP_RULES})


@app.post("/run", response_class=HTMLResponse)
async def run_action(request: Request, action: str = Form("check")):
    runners = {"check": run_check, "mcp": run_mcp, "gate": run_gate}
    result = runners.get(action, run_check)()
    return templates.TemplateResponse(
        "index.html",
        ctx(request, "/", action=action, result=result),
    )


@app.post("/lint", response_class=HTMLResponse)
async def lint_form(
    request: Request,
    agents_md: str = Form(""),
    mcp_json: str = Form(""),
):
    friendly = friendly_report(agents_md, mcp_json, None, None)
    custom = None
    report = None
    if friendly["mode"] == "lint":
        custom = lint_uploaded_context(agents_md, mcp_json or None)
        report = build_report(custom["check"], custom.get("mcp"))
        friendly = friendly_report(agents_md, mcp_json, custom, report)
    return templates.TemplateResponse(
        "index.html",
        ctx(
            request,
            "/",
            action="custom",
            custom_result=custom,
            report=report,
            friendly=friendly,
            agents_md=agents_md,
            mcp_json=mcp_json,
        ),
    )
