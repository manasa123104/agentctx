from __future__ import annotations

import sys
from pathlib import Path

from django.shortcuts import render
from django.views.decorators.http import require_http_methods

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "web"))

from shared.runner import DEMO, run_check, run_gate, run_mcp, run_workflow, lint_uploaded_context


def home(request):
    return render(
        request,
        "index.html",
        {
            "demo_path": str(DEMO),
            "framework": "Django",
            "run_url": "/run",
            "lint_url": "/lint",
            "image_prefix": "/static/",
        },
    )


@require_http_methods(["POST"])
def run_action(request):
    action = request.POST.get("action", "check")
    runners = {
        "workflow": run_workflow,
        "check": run_check,
        "mcp": run_mcp,
        "gate": run_gate,
    }
    result = runners.get(action, run_check)()
    return render(
        request,
        "index.html",
        {
            "demo_path": str(DEMO),
            "framework": "Django",
            "action": action,
            "result": result,
            "run_url": "/run",
            "lint_url": "/lint",
            "image_prefix": "/static/",
        },
    )


@require_http_methods(["POST"])
def lint_form(request):
    agents_md = request.POST.get("agents_md", "")
    mcp_json = request.POST.get("mcp_json", "")
    custom_result = lint_uploaded_context(agents_md, mcp_json or None)
    return render(
        request,
        "index.html",
        {
            "demo_path": str(DEMO),
            "framework": "Django",
            "action": "custom",
            "custom_result": custom_result,
            "agents_md": agents_md,
            "mcp_json": mcp_json,
            "run_url": "/run",
            "lint_url": "/lint",
            "image_prefix": "/static/",
        },
    )
