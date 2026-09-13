import { resolve } from 'path';
import { detectMcpConfigs } from '../detector/mcp.js';
import { mcpRules } from '../rules/mcp/index.js';
import { reportTerminal, reportJson } from '../reporter/index.js';
import { SEVERITY_RANK } from '../constants.js';

export async function mcp(projectDir, options = {}) {
  const { format = 'terminal', severity = 'info' } = options;
  const abs = resolve(projectDir);
  const min = SEVERITY_RANK[severity] ?? 0;
  const configs = detectMcpConfigs(abs);

  if (configs.length === 0) {
    if (format === 'json') {
      console.log(JSON.stringify({ file: null, diagnostics: [], summary: { errors: 0, warnings: 0, info: 0 } }));
    } else {
      console.log('No MCP config found (.mcp.json, .cursor/mcp.json, .vscode/mcp.json, .amazonq/mcp.json).');
    }
    return 0;
  }

  let hasErrors = false;
  for (const cfg of configs) {
    const diagnostics = [];
    for (const rule of mcpRules) {
      diagnostics.push(...rule.run(cfg));
    }
    const filtered = diagnostics.filter((d) => SEVERITY_RANK[d.severity] >= min);
    if (filtered.some((d) => d.severity === 'error')) hasErrors = true;
    if (format === 'json') reportJson(filtered, cfg.name);
    else reportTerminal(filtered, cfg.name);
  }

  return hasErrors ? 1 : 0;
}
