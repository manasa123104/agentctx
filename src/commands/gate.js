import { check } from './check.js';
import { mcp } from './mcp.js';
import { ANSI } from '../constants.js';

/**
 * CI-oriented gate: run context check + MCP validation.
 */
export async function gate(projectDir, options = {}) {
  const { strict = false } = options;
  console.log(`${ANSI.BOLD}agentctx gate${ANSI.RESET} — step 1/2: check\n`);
  const checkCode = await check(projectDir, {
    format: 'terminal',
    severity: 'info',
    strict,
  });

  console.log(`${ANSI.BOLD}agentctx gate${ANSI.RESET} — step 2/2: mcp\n`);
  const mcpCode = await mcp(projectDir, { format: 'terminal', severity: 'info' });

  const code = checkCode || mcpCode ? 1 : 0;
  if (code === 0) {
    console.log(`${ANSI.GREEN}✓ gate passed${ANSI.RESET}`);
  } else {
    console.log(`${ANSI.RED}✗ gate failed${ANSI.RESET} — fix issues, then re-run agentctx gate`);
  }
  return code;
}
