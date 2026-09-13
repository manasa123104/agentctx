import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { detectContextFiles } from '../detector/context-file.js';
import { scanProject } from '../detector/project.js';
import { parseContextFile } from '../parser/context-file.js';
import { rules } from '../rules/index.js';
import { tokenBudget } from '../rules/token-budget.js';
import { reportTerminal, reportJson, reportSarif, flushSarif } from '../reporter/index.js';
import { SEVERITY_RANK } from '../constants.js';
import { loadConfig } from '../config.js';

export async function check(projectDir, options = {}) {
  const { format = 'terminal', severity = 'info', strict = false } = options;
  const absDir = resolve(projectDir);
  const minSeverity = SEVERITY_RANK[severity] ?? 0;
  const cfg = loadConfig(absDir);
  if (strict) cfg.strict = true;

  let contextFiles = detectContextFiles(absDir);
  for (const custom of cfg.contextFiles || []) {
    const full = resolve(absDir, custom);
    if (existsSync(full) && !contextFiles.some((f) => f.path === full)) {
      contextFiles.push({
        name: custom,
        path: full,
        content: readFileSync(full, 'utf8'),
      });
    }
  }

  if (contextFiles.length === 0) {
    if (format === 'json') {
      console.log(JSON.stringify({ file: null, diagnostics: [], summary: { errors: 0, warnings: 0, info: 0 } }));
    } else {
      console.log('No context file found.');
      console.log('Run `agentctx init` then `agentctx check` — see WORKFLOW.md');
    }
    return 0;
  }

  const projectData = scanProject(absDir);
  let hasErrors = false;
  let hasWarnings = false;

  for (const contextFile of contextFiles) {
    const parsed = parseContextFile(contextFile.content);
    const other = [];

    const active = rules.filter((r) => {
      if (r.name === 'token-budget') return false;
      if (cfg.ignore.includes(r.name)) return false;
      if (cfg.checks && !cfg.checks.includes(r.name)) return false;
      return true;
    });

    for (const rule of active) {
      try {
        other.push(...rule.run(parsed, projectData));
      } catch (err) {
        console.error(`Rule ${rule.name} threw: ${err.message}`);
      }
    }

    let budget = [];
    const budgetSkipped =
      cfg.ignore.includes('token-budget') || (cfg.checks && !cfg.checks.includes('token-budget'));
    if (!budgetSkipped) {
      budget = tokenBudget.run(parsed, projectData, other, cfg.tokenThresholds);
    }

    const all = [...other, ...budget].filter((d) => SEVERITY_RANK[d.severity] >= minSeverity);
    if (all.some((d) => d.severity === 'error')) hasErrors = true;
    if (all.some((d) => d.severity === 'warn')) hasWarnings = true;

    if (format === 'json') reportJson(all, contextFile.name);
    else if (format === 'sarif') reportSarif(all, contextFile.name, contextFile.path);
    else reportTerminal(all, contextFile.name);
  }

  if (format === 'sarif') flushSarif();
  return hasErrors || (cfg.strict && hasWarnings) ? 1 : 0;
}
