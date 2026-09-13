"""Friendly input analysis for new users (random / empty / invalid text)."""
from __future__ import annotations

import json
import re
from typing import Any


def _looks_like_noise(text: str) -> bool:
    t = (text or "").strip()
    if not t:
        return False
    if len(t) < 8:
        return True
    # mostly symbols / keyboard mash
    letters = sum(c.isalpha() for c in t)
    if letters / max(len(t), 1) < 0.35:
        return True
    # no structure cues for a context file
    cues = ("#", "-", "*", "`", "npm", "build", "test", "agent", "install", "http")
    if not any(c in t.lower() for c in cues) and len(t.split()) < 12:
        return True
    # repeated same char
    if re.fullmatch(r"(.)\1{6,}", t):
        return True
    return False


def analyze_agents_text(text: str) -> dict[str, Any]:
    t = (text or "").strip()
    if not t:
        return {
            "ok": False,
            "level": "info",
            "title": "Nothing to scan yet",
            "message": "Paste an AGENTS.md (or any agent instruction file) into the box.",
            "tips": [
                "Start with a short heading like # AGENTS",
                "List real build/test commands, e.g. npm test",
                "Avoid directory trees and copy-pasted README text",
                "Try the Guide page if you are new",
            ],
            "example": "# AGENTS\n\n## Build & test\n- Install: `npm install`\n- Test: `npm test`\n",
        }

    if _looks_like_noise(t):
        return {
            "ok": False,
            "level": "warn",
            "title": "That looks like random text",
            "message": "agentctx expects project instructions for AI coding agents — not free-form chat or keyboard mash.",
            "tips": [
                "Use markdown with short sections (Build, Constraints)",
                "Mention only commands and paths that exist in your repo",
                "Click “Fill clean sample” on Studio to see a good example",
                "Or open Examples → demo-good and press Scan context",
            ],
            "example": "# AGENTS\n\n## Build & test\n- Test: `npm test`\n\n## Constraints\n- Keep this file short.\n",
        }

    return {
        "ok": True,
        "level": "ok",
        "title": "Looks like a context file",
        "message": "Running the scanner on your text…",
        "tips": [],
        "example": None,
    }


def analyze_mcp_text(text: str) -> dict[str, Any]:
    t = (text or "").strip()
    if not t:
        return {
            "ok": False,
            "level": "info",
            "title": "MCP box is empty",
            "message": "Optional: paste a .mcp.json config to validate secrets and server settings.",
            "tips": [
                'A minimal shape is { "mcpServers": { "name": { "command": "npx" } } }',
                "Never put real API keys in the file — use ${VAR} references",
            ],
            "example": '{\n  "mcpServers": {\n    "tools": {\n      "command": "npx",\n      "env": { "API_KEY": "${API_KEY}" }\n    }\n  }\n}\n',
        }

    if _looks_like_noise(t) and not t.startswith("{"):
        return {
            "ok": False,
            "level": "warn",
            "title": "That doesn’t look like MCP JSON",
            "message": "MCP configs are JSON files, usually named .mcp.json.",
            "tips": [
                "Must start with { and include mcpServers",
                "Use Load good sample in MCP Lab to see a safe template",
            ],
            "example": '{\n  "mcpServers": {\n    "tools": { "command": "npx" }\n  }\n}\n',
        }

    try:
        data = json.loads(t)
    except json.JSONDecodeError as err:
        return {
            "ok": False,
            "level": "error",
            "title": "Invalid JSON",
            "message": f"Could not parse MCP config: {err.msg} (line {err.lineno}).",
            "tips": [
                "Check for missing commas, quotes, or braces",
                "Paste into a JSON validator if unsure",
                "Try Load good sample, then edit it",
            ],
            "example": '{\n  "mcpServers": {\n    "tools": { "command": "npx" }\n  }\n}\n',
        }

    if not isinstance(data, dict) or "mcpServers" not in data:
        return {
            "ok": False,
            "level": "warn",
            "title": "JSON is valid, but not an MCP config",
            "message": "Expected a top-level mcpServers object.",
            "tips": [
                'Wrap your servers like: { "mcpServers": { ... } }',
            ],
            "example": '{\n  "mcpServers": {\n    "tools": { "command": "npx" }\n  }\n}\n',
        }

    return {
        "ok": True,
        "level": "ok",
        "title": "MCP JSON looks usable",
        "message": "Running MCP rules…",
        "tips": [],
        "example": None,
    }


def friendly_report(
    agents_md: str,
    mcp_json: str | None,
    custom: dict | None,
    report: dict | None,
) -> dict[str, Any]:
    """Combine pre-checks + lint results into a beginner-friendly payload."""
    agents = analyze_agents_text(agents_md)
    mcp = analyze_mcp_text(mcp_json or "") if (mcp_json and mcp_json.strip()) else None

    notices = [agents]
    if mcp is not None:
        notices.append(mcp)

    # If input is nonsense, skip scary empty lint noise — teach instead
    if not agents["ok"]:
        return {
            "mode": "teach",
            "notices": notices,
            "report": None,
            "custom_result": None,
            "headline": agents["title"],
            "summary_line": agents["message"],
        }

    if mcp is not None and not mcp["ok"]:
        return {
            "mode": "teach",
            "notices": notices,
            "report": None,
            "custom_result": None,
            "headline": mcp["title"],
            "summary_line": mcp["message"],
        }

    summary = (report or {}).get("summary") or {}
    errors = summary.get("errors", 0)
    warnings = summary.get("warnings", 0)
    if errors:
        headline = "Found issues to fix"
        summary_line = f"{errors} error(s), {warnings} warning(s). Start with the red items below."
    elif warnings:
        headline = "Mostly good — a few warnings"
        summary_line = f"No errors. {warnings} warning(s) you may want to tidy up."
    else:
        headline = "Looking clean"
        summary_line = "No errors or warnings. Nice work."

    return {
        "mode": "lint",
        "notices": notices,
        "report": report,
        "custom_result": custom,
        "headline": headline,
        "summary_line": summary_line,
    }
