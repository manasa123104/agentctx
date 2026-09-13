import { SEVERITY } from '../constants.js';

function extractNpmScript(cmd) {
  const m = cmd.match(/(?:npm|pnpm|yarn|bun)(?:\s+run)?\s+([a-zA-Z0-9:_-]+)/);
  return m ? m[1] : null;
}

function extractMakeTarget(cmd) {
  const m = cmd.match(/\bmake\s+([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export const staleCommand = {
  name: 'stale-command',
  severity: SEVERITY.ERROR,
  description: 'Build/test commands that do not match project tooling',
  run(parsed, project) {
    const out = [];
    const seen = new Set();

    for (const item of parsed.commands) {
      const cmd = item.command;
      if (seen.has(`${item.line}:${cmd}`)) continue;
      seen.add(`${item.line}:${cmd}`);

      if (/\b(cargo)\b/.test(cmd) && !project.hasCargo) {
        out.push({
          rule: 'stale-command',
          severity: SEVERITY.ERROR,
          line: item.line,
          message: `\`${cmd}\` — no Cargo.toml found`,
          suggestion: 'Remove cargo commands or add a Rust project.',
        });
        continue;
      }

      if (/\bgo\s+(build|test|run|mod)\b/.test(cmd) && !project.hasGoMod) {
        out.push({
          rule: 'stale-command',
          severity: SEVERITY.ERROR,
          line: item.line,
          message: `\`${cmd}\` — no go.mod found`,
          suggestion: 'Remove go commands or add a Go module.',
        });
        continue;
      }

      if (/\b(uv|poetry|pytest)\b/.test(cmd) && !project.hasPython) {
        out.push({
          rule: 'stale-command',
          severity: SEVERITY.ERROR,
          line: item.line,
          message: `\`${cmd}\` — no Python project markers found`,
          suggestion: 'Remove Python commands or add pyproject.toml / requirements.txt.',
        });
        continue;
      }

      const script = extractNpmScript(cmd);
      if (script && project.packageJson) {
        if (!project.scripts.includes(script) && !['install', 'ci', 'pack', 'publish'].includes(script)) {
          out.push({
            rule: 'stale-command',
            severity: SEVERITY.ERROR,
            line: item.line,
            message: `\`${cmd}\` — script "${script}" does not exist in package.json`,
            suggestion:
              project.scripts.length > 0
                ? `Available scripts: ${project.scripts.join(', ')}`
                : 'Add the script or remove the command.',
          });
        }
        continue;
      }

      const target = extractMakeTarget(cmd);
      if (target && project.makefileTargets.length > 0 && !project.makefileTargets.includes(target)) {
        out.push({
          rule: 'stale-command',
          severity: SEVERITY.ERROR,
          line: item.line,
          message: `\`${cmd}\` — make target "${target}" not found in Makefile`,
          suggestion: `Available targets: ${project.makefileTargets.join(', ')}`,
        });
      }
    }

    return out;
  },
};
