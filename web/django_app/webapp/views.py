from __future__ import annotations

import sys
from pathlib import Path

from django.shortcuts import render
from django.views.decorators.http import require_http_methods

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "web"))

from shared.catalog import (
    CONTEXT_RULES,
    MCP_RULES,
    NAV,
    SAMPLE_AGENTS_BAD,
    SAMPLE_AGENTS_GOOD,
    SAMPLE_MCP_BAD,
    SAMPLE_MCP_GOOD,
)
from shared.runner import (
    DEMO,
    DEMO_GOOD,
    build_report,
    lint_uploaded_context,
    run_check,
    run_gate,
    run_init_preview,
    run_mcp,
)


def base(active: str, **extra):
    return {
        "framework": "Django",
        "nav": NAV,
        "active": active,
        "run_url": "/run",
        "examples_url": "/examples",
        "mcp_lab_url": "/mcp-lab",
        "studio_url": "/studio",
        "about_url": "/about",
        **extra,
    }


def home(request):
    return render(request, "index.html", base("/"))


def rules(request):
    return render(
        request,
        "rules.html",
        base("/rules", context_rules=CONTEXT_RULES, mcp_rules=MCP_RULES),
    )


@require_http_methods(["GET", "POST"])
def examples(request):
    if request.method == "GET":
        return render(request, "examples.html", base("/examples"))

    fixture = request.POST.get("fixture", "bad")
    action = request.POST.get("action", "check")
    target = DEMO_GOOD if fixture == "good" else DEMO
    if action == "mcp":
        result = run_mcp(target, fmt="json")
        result["stdout"] = run_mcp(target)["stdout"]
    elif action == "gate":
        result = run_gate(target)
    else:
        result = run_check(target, fmt="json")
        result["stdout"] = run_check(target)["stdout"]
    return render(
        request,
        "examples.html",
        base("/examples", result=result, fixture=fixture, action=action),
    )


@require_http_methods(["GET", "POST"])
def mcp_lab(request):
    mcp_json = SAMPLE_MCP_BAD
    result = None
    if request.method == "POST":
        preset = request.POST.get("preset")
        mcp_json = request.POST.get("mcp_json", "")
        if preset == "bad":
            mcp_json = SAMPLE_MCP_BAD
        elif preset == "good":
            mcp_json = SAMPLE_MCP_GOOD
        packed = lint_uploaded_context("# MCP lab\n", mcp_json)
        result = packed["mcp"]
    return render(
        request,
        "mcp_lab.html",
        base("/mcp-lab", mcp_json=mcp_json, result=result),
    )


@require_http_methods(["GET", "POST"])
def studio(request):
    agents_md = SAMPLE_AGENTS_BAD
    mcp_json = SAMPLE_MCP_BAD
    custom = None
    report = None
    if request.method == "POST":
        preset = request.POST.get("preset")
        agents_md = request.POST.get("agents_md", "")
        mcp_json = request.POST.get("mcp_json", "")
        if preset == "bad":
            agents_md, mcp_json = SAMPLE_AGENTS_BAD, SAMPLE_MCP_BAD
        elif preset == "good":
            agents_md, mcp_json = SAMPLE_AGENTS_GOOD, SAMPLE_MCP_GOOD
        custom = lint_uploaded_context(agents_md, mcp_json)
        report = build_report(custom["check"], custom.get("mcp"))
    return render(
        request,
        "studio.html",
        base(
            "/studio",
            agents_md=agents_md,
            mcp_json=mcp_json,
            custom_result=custom,
            report=report,
        ),
    )


@require_http_methods(["GET", "POST"])
def about(request):
    result = None
    if request.method == "POST" and request.POST.get("action") == "init":
        result = run_init_preview()
    return render(request, "about.html", base("/about", result=result))


@require_http_methods(["POST"])
def run_action(request):
    action = request.POST.get("action", "check")
    runners = {"check": run_check, "mcp": run_mcp, "gate": run_gate}
    result = runners.get(action, run_check)()
    return render(request, "index.html", base("/", action=action, result=result))


@require_http_methods(["POST"])
def lint_form(request):
    agents_md = request.POST.get("agents_md", "")
    mcp_json = request.POST.get("mcp_json", "")
    custom = lint_uploaded_context(agents_md, mcp_json or None)
    report = build_report(custom["check"], custom.get("mcp"))
    return render(
        request,
        "index.html",
        base(
            "/",
            action="custom",
            custom_result=custom,
            report=report,
            agents_md=agents_md,
            mcp_json=mcp_json,
        ),
    )
