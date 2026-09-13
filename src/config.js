import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const DEFAULTS = {
  checks: null,
  ignore: [],
  strict: false,
  contextFiles: [],
  tokenThresholds: {
    info: 500,
    warning: 2000,
    error: 5000,
  },
};

export function loadConfig(projectDir) {
  const candidates = ['.agentctxrc', '.agentctxrc.json', '.ctxlintrc', '.ctxlintrc.json'];
  for (const name of candidates) {
    const full = join(projectDir, name);
    if (!existsSync(full)) continue;
    try {
      const raw = JSON.parse(readFileSync(full, 'utf8'));
      return {
        ...DEFAULTS,
        ...raw,
        ignore: Array.isArray(raw.ignore) ? raw.ignore : DEFAULTS.ignore,
        contextFiles: Array.isArray(raw.contextFiles) ? raw.contextFiles : DEFAULTS.contextFiles,
        tokenThresholds: { ...DEFAULTS.tokenThresholds, ...(raw.tokenThresholds || {}) },
      };
    } catch {
      console.error(`Warning: could not parse ${name}; using defaults.`);
    }
  }
  return { ...DEFAULTS };
}
