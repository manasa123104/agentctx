import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { CONTEXT_FILES } from '../constants.js';

export function detectContextFiles(projectDir) {
  const found = [];

  for (const name of CONTEXT_FILES) {
    const full = join(projectDir, name);
    if (existsSync(full) && statSync(full).isFile()) {
      found.push({
        name,
        path: full,
        content: readFileSync(full, 'utf8'),
      });
    }
  }

  const cursorRules = join(projectDir, '.cursor', 'rules');
  if (existsSync(cursorRules) && statSync(cursorRules).isDirectory()) {
    for (const entry of readdirSync(cursorRules)) {
      if (!entry.endsWith('.md') && !entry.endsWith('.mdc')) continue;
      const full = join(cursorRules, entry);
      if (!statSync(full).isFile()) continue;
      found.push({
        name: relative(projectDir, full).replace(/\\/g, '/'),
        path: full,
        content: readFileSync(full, 'utf8'),
      });
    }
  }

  return found;
}
