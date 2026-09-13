import { ANSI } from '../constants.js';

export function workflow() {
  const steps = [
    ['1. Discover', 'Find or create an agent context file'],
    ['2. Init', 'agentctx init [--dry-run]'],
    ['3. Check', 'agentctx check [--strict] [--format json|sarif]'],
    ['4. Slim', 'agentctx slim AGENTS.md [--dry-run] [--backup]'],
    ['5. MCP', 'agentctx mcp'],
    ['6. Gate', 'agentctx gate [--strict]   # CI: check + mcp'],
  ];

  console.log(`\n${ANSI.BOLD}agentctx workflow${ANSI.RESET}\n`);
  console.log('Keep agent context files small, accurate, and non-redundant.\n');

  for (const [title, detail] of steps) {
    console.log(`  ${ANSI.GREEN}${title}${ANSI.RESET}`);
    console.log(`     ${ANSI.GRAY}${detail}${ANSI.RESET}\n`);
  }

  console.log('Loop: edit → check → slim → gate until clean.');
  console.log('Full guide: WORKFLOW.md\n');
}
