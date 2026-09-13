"""Shared web catalog: rules, samples, helpers."""
from __future__ import annotations

CONTEXT_RULES = [
    {
        "id": "stale-file-ref",
        "severity": "error",
        "kind": "context",
        "summary": "Flags paths that do not exist on disk.",
    },
    {
        "id": "stale-command",
        "severity": "error",
        "kind": "context",
        "summary": "Flags scripts/targets missing from package.json, Makefile, Cargo, Go, or Python.",
    },
    {
        "id": "no-directory-tree",
        "severity": "error",
        "kind": "context",
        "summary": "Removes embedded directory trees agents can discover themselves.",
    },
    {
        "id": "redundant-readme",
        "severity": "warn",
        "kind": "context",
        "summary": "Detects high overlap with README.md.",
    },
    {
        "id": "no-inferable-stack",
        "severity": "warn",
        "kind": "context",
        "summary": "Flags stack prose already obvious from manifests.",
    },
    {
        "id": "max-lines",
        "severity": "warn",
        "kind": "context",
        "summary": "Warns when context files grow past ~200 lines.",
    },
    {
        "id": "no-style-guide",
        "severity": "info",
        "kind": "context",
        "summary": "Style tips that belong in ESLint/Prettier, not AGENTS.md.",
    },
    {
        "id": "token-budget",
        "severity": "warn",
        "kind": "context",
        "summary": "Estimates tokens and signal-to-noise from other findings.",
    },
    {
        "id": "ci-coverage",
        "severity": "info",
        "kind": "context",
        "summary": "Notes CI workflows never mentioned in the context file.",
    },
]

MCP_RULES = [
    {
        "id": "mcp-schema",
        "severity": "error",
        "kind": "mcp",
        "summary": "Requires a valid mcpServers object.",
    },
    {
        "id": "mcp-missing-command",
        "severity": "error",
        "kind": "mcp",
        "summary": "Each server needs a command or url.",
    },
    {
        "id": "mcp-hardcoded-secret",
        "severity": "error",
        "kind": "mcp",
        "summary": "Blocks API keys and tokens hardcoded in env.",
    },
    {
        "id": "mcp-localhost-url",
        "severity": "warn",
        "kind": "mcp",
        "summary": "Warns when urls point at localhost only.",
    },
    {
        "id": "mcp-deprecated-transport",
        "severity": "warn",
        "kind": "mcp",
        "summary": "Flags deprecated SSE transport.",
    },
    {
        "id": "mcp-env-syntax",
        "severity": "warn",
        "kind": "mcp",
        "summary": "Checks ${env:VAR} syntax for VS Code configs.",
    },
]

SAMPLE_AGENTS_BAD = """# Demo project

## Stack
This is a TypeScript web application built with React 18.

## Structure
```
src/
├── old-api/
├── components/
└── utils/
```

## Commands
- Test: `npm run test:integration`
- Prefer const over let

See also `src/missing-file.js`.
"""

SAMPLE_AGENTS_GOOD = """# AGENTS

## Build & test
- Install: `npm install`
- Test: `npm test`
- Build: `npm run build`

## Constraints
- Keep context files short.
- Do not embed directory trees.
- Prefer facts agents cannot infer from package.json.
"""

SAMPLE_MCP_BAD = """{
  "mcpServers": {
    "tools": {
      "command": "npx",
      "env": { "OPENAI_API_KEY": "sk-demo-hardcoded-key" }
    },
    "local": {
      "url": "http://localhost:8080/mcp",
      "transport": "sse"
    }
  }
}
"""

SAMPLE_MCP_GOOD = """{
  "mcpServers": {
    "tools": {
      "command": "npx",
      "args": ["-y", "some-mcp-server"],
      "env": { "OPENAI_API_KEY": "${OPENAI_API_KEY}" }
    }
  }
}
"""

NAV = [
    {"href": "/", "label": "Desk"},
    {"href": "/guide", "label": "Guide"},
    {"href": "/rules", "label": "Rules"},
    {"href": "/examples", "label": "Examples"},
    {"href": "/mcp-lab", "label": "MCP Lab"},
    {"href": "/studio", "label": "Studio"},
    {"href": "/about", "label": "About"},
]
