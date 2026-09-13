"""Run the agentctx Node CLI and capture output."""
from __future__ import annotations

import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLI = ROOT / "bin" / "agentctx.js"
DEMO = ROOT / "examples" / "demo-bad"
DEMO_GOOD = ROOT / "examples" / "demo-good"

ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")


def strip_ansi(text: str) -> str:
    return ANSI_RE.sub("", text or "")


def _node_cmd(*args: str, cwd: Path | None = None) -> dict:
    cmd = ["node", str(CLI), *args]
    proc = subprocess.run(
        cmd,
        cwd=str(cwd or ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    stdout = strip_ansi(proc.stdout)
    stderr = strip_ansi(proc.stderr)
    payload = {
        "command": " ".join(cmd),
        "exit_code": proc.returncode,
        "stdout": stdout,
        "stderr": stderr,
        "diagnostics": [],
        "summary": {"errors": 0, "warnings": 0, "info": 0},
    }

    # Prefer structured diagnostics when JSON format is requested
    if "--format" in args and "json" in args:
        try:
            data = json.loads(proc.stdout or "{}")
            if isinstance(data, dict):
                payload["diagnostics"] = data.get("diagnostics") or []
                payload["summary"] = data.get("summary") or payload["summary"]
                payload["file"] = data.get("file")
        except json.JSONDecodeError:
            pass
    return payload


def run_check(target: Path | None = None, fmt: str = "terminal") -> dict:
    path = target or DEMO
    return _node_cmd("check", str(path), "--format", fmt)


def run_mcp(target: Path | None = None, fmt: str = "terminal") -> dict:
    path = target or DEMO
    return _node_cmd("mcp", str(path), "--format", fmt)


def run_gate(target: Path | None = None) -> dict:
    path = target or DEMO
    return _node_cmd("gate", str(path))


def run_init_preview(target: Path | None = None) -> dict:
    path = target or ROOT
    return _node_cmd("init", str(path), "--dry-run")


def lint_uploaded_context(content: str, mcp_json: str | None = None) -> dict:
    """Write temp project files and run check + mcp with JSON diagnostics."""
    with tempfile.TemporaryDirectory(prefix="agentctx-web-") as tmp:
        tmp_path = Path(tmp)
        (tmp_path / "AGENTS.md").write_text(content, encoding="utf-8")
        (tmp_path / "package.json").write_text(
            json.dumps({"name": "upload", "scripts": {"test": "echo ok", "build": "echo ok"}}),
            encoding="utf-8",
        )
        if mcp_json and mcp_json.strip():
            (tmp_path / ".mcp.json").write_text(mcp_json, encoding="utf-8")

        check = run_check(tmp_path, fmt="json")
        # also keep human text
        check_text = run_check(tmp_path, fmt="terminal")
        check["stdout"] = check_text["stdout"]

        mcp = None
        if mcp_json and mcp_json.strip():
            mcp = run_mcp(tmp_path, fmt="json")
            mcp_text = run_mcp(tmp_path, fmt="terminal")
            mcp["stdout"] = mcp_text["stdout"]
        return {"check": check, "mcp": mcp}


def build_report(check: dict, mcp: dict | None = None) -> dict:
    diags = list(check.get("diagnostics") or [])
    if mcp:
        diags.extend(mcp.get("diagnostics") or [])
    errors = sum(1 for d in diags if d.get("severity") == "error")
    warnings = sum(1 for d in diags if d.get("severity") == "warn")
    info = sum(1 for d in diags if d.get("severity") == "info")
    return {
        "diagnostics": diags,
        "summary": {"errors": errors, "warnings": warnings, "info": info},
        "passed": errors == 0,
    }
