import { resolve, join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { scanProject } from '../detector/project.js';

function buildContent(project, format) {
  const title =
    format === 'claude' ? 'CLAUDE.md' : format === 'gemini' ? 'GEMINI.md' : 'AGENTS.md';

  const lines = [`# ${title.replace('.md', '')}`, ''];
  lines.push('## Build & test');

  if (project.packageJson) {
    const pm = project.packageManager || 'npm';
    lines.push(`- Install: \`${pm} install\``);
    if (project.scripts.includes('test')) lines.push(`- Test: \`${pm} test\``);
    if (project.scripts.includes('build')) lines.push(`- Build: \`${pm} run build\``);
    if (project.scripts.includes('lint')) lines.push(`- Lint: \`${pm} run lint\``);
  } else if (project.hasCargo) {
    lines.push('- Build: `cargo build`');
    lines.push('- Test: `cargo test`');
    lines.push('- Lint: `cargo clippy`');
  } else if (project.hasGoMod) {
    lines.push('- Build: `go build ./...`');
    lines.push('- Test: `go test ./...`');
    lines.push('- Format: `go fmt ./...`');
  } else if (project.hasPython) {
    lines.push('- Test: `pytest` (or `uv run pytest` / `poetry run pytest`)');
  } else if (project.makefileTargets.length) {
    lines.push(`- Make targets: ${project.makefileTargets.slice(0, 8).join(', ')}`);
  } else {
    lines.push('- Add project-specific build/test commands here.');
  }

  lines.push('');
  lines.push('## Constraints');
  lines.push('- Prefer facts the agent cannot infer from manifests.');
  lines.push('- Do not embed directory trees.');
  lines.push('- Do not duplicate README install docs.');
  lines.push('');
  lines.push('## Workflow');
  lines.push('1. `agentctx check` — lint this file');
  lines.push('2. `agentctx slim <file>` — remove error-severity bloat');
  lines.push('3. `agentctx mcp` — validate MCP configs');
  lines.push('4. `agentctx gate` — CI gate (check + mcp)');
  lines.push('');

  return lines.join('\n');
}

const FILE_FOR = {
  agents: 'AGENTS.md',
  claude: 'CLAUDE.md',
  gemini: 'GEMINI.md',
};

export async function init(projectDir, options = {}) {
  const { format = 'agents', dryRun = false, force = false } = options;
  const abs = resolve(projectDir);
  const project = scanProject(abs);
  const formats = format === 'all' ? ['agents', 'claude', 'gemini'] : [format];

  for (const fmt of formats) {
    const name = FILE_FOR[fmt] || 'AGENTS.md';
    const target = join(abs, name);
    const body = buildContent(project, fmt);

    if (dryRun) {
      console.log(`--- ${name} (dry-run) ---`);
      console.log(body);
      continue;
    }

    if (existsSync(target) && !force) {
      console.error(`${name} already exists. Use --force to overwrite.`);
      return 1;
    }

    writeFileSync(target, body, 'utf8');
    console.log(`Wrote ${name}`);
  }

  console.log('\nNext: agentctx check');
  return 0;
}
