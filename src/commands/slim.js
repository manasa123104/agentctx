import { resolve, dirname } from 'path';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { parseContextFile } from '../parser/context-file.js';
import { scanProject } from '../detector/project.js';
import { rules } from '../rules/index.js';

/**
 * Remove lines flagged by error-severity diagnostics (best-effort).
 */
export async function slim(filePath, options = {}) {
  const { dryRun = false, backup = false } = options;
  const abs = resolve(filePath);
  if (!existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    return 1;
  }

  const content = readFileSync(abs, 'utf8');
  const project = scanProject(dirname(abs));
  const parsed = parseContextFile(content);

  const diagnostics = [];
  for (const rule of rules) {
    if (rule.name === 'token-budget') continue;
    diagnostics.push(...rule.run(parsed, project));
  }

  const errorLines = new Set(
    diagnostics.filter((d) => d.severity === 'error' && d.line).map((d) => d.line),
  );

  // Expand directory-tree ranges: remove consecutive tree-looking lines around errors
  const lines = content.split(/\r?\n/);
  const remove = new Set(errorLines);

  // For no-directory-tree, also drop following tree lines
  for (const d of diagnostics) {
    if (d.rule !== 'no-directory-tree' || d.severity !== 'error') continue;
    const start = d.line - 1;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      if (i > start && !/[├└│]|^\s{0,4}[\w.-]+\/?\s*$/.test(line) && line.trim() !== '') break;
      if (/[├└│]/.test(line) || /^\s{0,4}[\w.-]+\/?\s*$/.test(line)) remove.add(i + 1);
    }
  }

  if (remove.size === 0) {
    console.log('No error-severity line removals needed.');
    return 0;
  }

  const next = lines.filter((_, idx) => !remove.has(idx + 1)).join('\n');
  const removed = lines.length - next.split(/\r?\n/).length;

  if (dryRun) {
    console.log(`Would remove ~${removed} lines from ${filePath}`);
    for (const line of [...remove].sort((a, b) => a - b).slice(0, 20)) {
      console.log(`  - L${line}: ${lines[line - 1]}`);
    }
    return 0;
  }

  if (backup) copyFileSync(abs, abs + '.bak');
  writeFileSync(abs, next, 'utf8');
  console.log(`Slimmed ${filePath}: removed ~${removed} lines${backup ? ' (backup .bak)' : ''}`);
  console.log('Next: agentctx check');
  return 0;
}
