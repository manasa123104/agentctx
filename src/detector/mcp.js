import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { MCP_CONFIG_PATHS } from '../constants.js';

export function detectMcpConfigs(projectDir) {
  const found = [];
  for (const name of MCP_CONFIG_PATHS) {
    const full = join(projectDir, name);
    if (!existsSync(full)) continue;
    try {
      const raw = readFileSync(full, 'utf8');
      found.push({
        name,
        path: full,
        content: raw,
        json: JSON.parse(raw),
      });
    } catch {
      found.push({
        name,
        path: full,
        content: '',
        json: null,
        parseError: true,
      });
    }
  }
  return found;
}
