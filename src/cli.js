import { Command } from 'commander';
import { readFileSync } from 'fs';
import { check } from './commands/check.js';
import { init } from './commands/init.js';
import { slim } from './commands/slim.js';
import { mcp } from './commands/mcp.js';
import { workflow } from './commands/workflow.js';
import { gate } from './commands/gate.js';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

export function run(argv) {
  const program = new Command();

  program
    .name('agentctx')
    .description('Lint AI agent context files and MCP configs with a clear workflow.')
    .version(version);

  program
    .command('workflow')
    .description('Print the recommended agentctx workflow')
    .action(() => {
      workflow();
    });

  program
    .command('init [path]')
    .description('Generate a minimal AGENTS.md from project metadata')
    .option('--format <fmt>', 'agents | claude | gemini | all', 'agents')
    .option('--dry-run', 'Print without writing')
    .option('--force', 'Overwrite existing file')
    .action(async (projectPath, options) => {
      process.exit(await init(projectPath || process.cwd(), options));
    });

  program
    .command('check [path]')
    .description('Lint context files')
    .option('--format <fmt>', 'terminal | json | sarif', 'terminal')
    .option('--severity <level>', 'info | warn | error', 'info')
    .option('--strict', 'Exit 1 on warnings too')
    .action(async (projectPath, options) => {
      process.exit(
        await check(projectPath || process.cwd(), {
          format: options.format,
          severity: options.severity,
          strict: options.strict || false,
        }),
      );
    });

  program
    .command('slim <file>')
    .description('Remove error-severity issues from a context file')
    .option('--dry-run', 'Show what would be removed')
    .option('--backup', 'Write .bak before editing')
    .action(async (file, options) => {
      process.exit(await slim(file, options));
    });

  program
    .command('mcp [path]')
    .description('Validate MCP server config files')
    .option('--format <fmt>', 'terminal | json', 'terminal')
    .option('--severity <level>', 'info | warn | error', 'info')
    .action(async (projectPath, options) => {
      process.exit(
        await mcp(projectPath || process.cwd(), {
          format: options.format,
          severity: options.severity,
        }),
      );
    });

  program
    .command('gate [path]')
    .description('CI gate: check + mcp (exit 1 on errors)')
    .option('--strict', 'Also fail on warnings')
    .action(async (projectPath, options) => {
      process.exit(
        await gate(projectPath || process.cwd(), {
          strict: options.strict || false,
        }),
      );
    });

  // Default / bare path → check
  if (
    argv.length <= 2 ||
    (argv.length === 3 &&
      !['check', 'init', 'slim', 'mcp', 'gate', 'workflow', '--version', '--help', '-V', '-h'].includes(
        argv[2],
      ))
  ) {
    if (argv.length === 3 && !argv[2].startsWith('-')) {
      check(argv[2], { format: 'terminal', severity: 'info' }).then((code) => process.exit(code));
      return;
    }
  }

  program.parse(argv);
}
