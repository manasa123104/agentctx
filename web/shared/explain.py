"""Friendly input analysis and plain-English help for new users."""
from __future__ import annotations

import json
import re
from typing import Any

RULE_HELP = {
    "stale-file-ref": {
        "plain": "The file mentions a path that isn’t in the project.",
        "fix": "Delete the path or rename it to a file/folder that actually exists.",
    },
    "stale-command": {
        "plain": "A build/test command doesn’t match your package scripts (or Makefile/Cargo/etc.).",
        "fix": "Change the command to a real script name, or add that script to package.json.",
    },
    "no-directory-tree": {
        "plain": "There’s a folder tree drawn in the file. Agents can list folders themselves.",
        "fix": "Delete the tree block to save tokens and avoid stale structure.",
    },
    "redundant-readme": {
        "plain": "A lot of this text already appears in README.md.",
        "fix": "Keep only agent-specific notes; point to the README for install docs.",
    },
    "no-inferable-stack": {
        "plain": "You’re describing the tech stack in prose, but the agent can already see it from package files.",
        "fix": "Remove “this is a React/TypeScript app…” style lines unless there’s a non-obvious constraint.",
    },
    "max-lines": {
        "plain": "The context file is getting long, which usually means noise.",
        "fix": "Cut duplicated docs and keep only must-know constraints.",
    },
    "no-style-guide": {
        "plain": "Style tips (quotes, const vs let) belong in a linter/formatter config.",
        "fix": "Remove those bullets; keep ESLint/Prettier as the source of truth.",
    },
    "token-budget": {
        "plain": "A rough cost/quality score for how noisy this file is.",
        "fix": "Fix errors/warnings above — the score usually improves after cleanup.",
    },
    "ci-coverage": {
        "plain": "You have CI workflows the context file never mentions.",
        "fix": "Optional: note how agents should react to CI failures.",
    },
    "mcp-schema": {
        "plain": "The MCP file isn’t shaped correctly.",
        "fix": 'Use { "mcpServers": { "name": { "command": "…" } } }.',
    },
    "mcp-missing-command": {
        "plain": "A server entry can’t start — no command and no url.",
        "fix": "Add a command (local process) or a url (remote server).",
    },
    "mcp-hardcoded-secret": {
        "plain": "A secret/API key is written directly in the config.",
        "fix": 'Replace with an env reference like "${API_KEY}".',
    },
    "mcp-localhost-url": {
        "plain": "This server only works on your machine (localhost).",
        "fix": "Fine for local dev; use a shared URL for teammates/CI.",
    },
    "mcp-deprecated-transport": {
        "plain": "SSE transport is outdated in modern MCP clients.",
        "fix": "Remove the transport field and use the default HTTP setup.",
    },
    "mcp-env-syntax": {
        "plain": "Environment variable syntax doesn’t match this editor/client.",
        "fix": "In VS Code MCP configs, prefer ${env:VAR}.",
    },
}


def enrich_diagnostics(diagnostics: list[dict] | None) -> list[dict]:
    out = []
    for d in diagnostics or []:
        item = dict(d)
        help_ = RULE_HELP.get(item.get("rule") or "", {})
        item["plain"] = help_.get("plain") or "This finding needs a closer look."
        item["fix"] = help_.get("fix") or (item.get("suggestion") or "Follow the suggestion above.")
        out.append(item)
    return out


def _looks_like_noise(text: str) -> bool:
    t = (text or "").strip()
    if not t:
        return False
    if len(t) < 8:
        return True
    letters = sum(c.isalpha() for c in t)
    if letters / max(len(t), 1) < 0.35:
        return True
    cues = ("#", "-", "*", "`", "npm", "build", "test", "agent", "install", "http")
    if not any(c in t.lower() for c in cues) and len(t.split()) < 12:
        return True
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
    agents = analyze_agents_text(agents_md)
    mcp = analyze_mcp_text(mcp_json or "") if (mcp_json and mcp_json.strip()) else None

    notices = [agents]
    if mcp is not None:
        notices.append(mcp)

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

    if report is not None:
        report = dict(report)
        report["diagnostics"] = enrich_diagnostics(report.get("diagnostics"))

    return {
        "mode": "lint",
        "notices": notices,
        "report": report,
        "custom_result": custom,
        "headline": headline,
        "summary_line": summary_line,
        "next_steps": (
            [
                "Fix errors first (red).",
                "Re-run Generate report.",
                "Then decide which warnings to keep.",
            ]
            if errors or warnings
            else ["You’re done — keep the file short as the project evolves."]
        ),
    }
