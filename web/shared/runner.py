"""Run the agentctx Node CLI and capture output."""
from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLI = ROOT / "bin" / "agentctx.js"
DEMO = ROOT / "examples" / "demo-bad"


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
    return {
        "command": " ".join(cmd),
        "exit_code": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
    }


def run_workflow() -> dict:
    return _node_cmd("workflow")


def run_check(target: Path | None = None, fmt: str = "terminal") -> dict:
    path = target or DEMO
    return _node_cmd("check", str(path), "--format", fmt)


def run_mcp(target: Path | None = None, fmt: str = "terminal") -> dict:
    path = target or DEMO
    return _node_cmd("mcp", str(path), "--format", fmt)


def run_gate(target: Path | None = None) -> dict:
    path = target or DEMO
    return _node_cmd("gate", str(path))


def lint_uploaded_context(content: str, mcp_json: str | None = None) -> dict:
    """Write temp project files and run check + mcp."""
    with tempfile.TemporaryDirectory(prefix="agentctx-web-") as tmp:
        tmp_path = Path(tmp)
        (tmp_path / "AGENTS.md").write_text(content, encoding="utf-8")
        (tmp_path / "package.json").write_text(
            json.dumps({"name": "upload", "scripts": {"test": "echo ok", "build": "echo ok"}}),
            encoding="utf-8",
        )
        if mcp_json and mcp_json.strip():
            (tmp_path / ".mcp.json").write_text(mcp_json, encoding="utf-8")

        check = run_check(tmp_path)
        mcp = run_mcp(tmp_path) if mcp_json and mcp_json.strip() else None
        return {"check": check, "mcp": mcp}
