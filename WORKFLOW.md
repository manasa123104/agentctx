# agentctx workflow

This project is built around one loop: **keep agent context accurate and small**.

![agentctx workflow overview](docs/images/workflow-overview.png)

![Daily developer loop](docs/images/workflow-daily-loop.png)

Re-run `check` after every edit until the file is clean, then rely on `gate` in CI.

---

## Step 1 — Init

Generate a minimal context file from what the repo already knows (`package.json`, Cargo, Go, Python, Makefile).

```bash
npx agentctx init --dry-run    # preview
npx agentctx init              # write AGENTS.md
npx agentctx init --format all # AGENTS + CLAUDE + GEMINI
```

**Do not** paste directory trees or README install sections into the file.

---

## Step 2 — Check

```bash
npx agentctx check
npx agentctx check --severity warn
npx agentctx check --strict
npx agentctx check --format json
npx agentctx check --format sarif > agentctx.sarif
```

Exit codes:

| Code | Meaning |
|------|---------|
| 0 | No errors (warnings OK unless `--strict`) |
| 1 | Errors found (or warnings with `--strict`) |

---

## Step 3 — Slim

Auto-remove error-severity content (trees, bad lines tied to errors):

```bash
npx agentctx slim AGENTS.md --dry-run
npx agentctx slim AGENTS.md --backup
```

Then open the file and fix remaining warnings manually (inferable stack, README overlap, etc.).

---

## Step 4 — MCP

```bash
npx agentctx mcp
npx agentctx mcp --format json
```

Looks for:

- `.mcp.json`
- `.cursor/mcp.json`
- `.vscode/mcp.json`
- `.amazonq/mcp.json`

---

## Step 5 — Gate (CI)

One command for pull requests:

```bash
npx agentctx gate --strict
```

### GitHub Actions

```yaml
name: agentctx
on: [push, pull_request]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx agentctx gate --strict
```

### Pre-commit

```bash
npx agentctx check --strict
npx agentctx mcp
```

---

## Daily developer loop

1. Edit `AGENTS.md` / `CLAUDE.md`
2. `agentctx check`
3. If errors: `agentctx slim <file> --backup` or edit by hand
4. `agentctx mcp` if you touched MCP configs
5. Push — CI runs `agentctx gate`

Print this anytime:

```bash
npx agentctx workflow
```
