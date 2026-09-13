# AGENTS.md

## Build & test
- Install: `npm install`
- Test: `npm test`
- Run CLI: `node bin/agentctx.js check`

## Architecture
CLI wiring is in `src/cli.js`. Detectors, parser, rules, commands, and reporters live under `src/`.
MCP rules are in `src/rules/mcp/`.

## Constraints
- One runtime dependency: `commander`
- ESM only; use synchronous filesystem reads
- Each rule exports `{ name, severity, description, run(...) }`
- Prefer the clear workflow: init → check → slim → mcp → gate

## Workflow
1. `agentctx check`
2. `agentctx slim AGENTS.md` for error bloat
3. `agentctx mcp`
4. `agentctx gate` in CI
