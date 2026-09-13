import { SEVERITY } from '../constants.js';

const SKIP = new Set([
  'node_modules',
  'package.json',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'LICENSE',
]);

export const staleFileRef = {
  name: 'stale-file-ref',
  severity: SEVERITY.ERROR,
  description: 'References files/dirs that do not exist on disk',
  run(parsed, project) {
    const out = [];
    const seen = new Set();

    for (const ref of parsed.fileRefs) {
      const key = `${ref.line}:${ref.path}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const base = ref.path.split('/').pop();
      if (SKIP.has(base) || SKIP.has(ref.path)) continue;
      if (ref.path.includes('*') || ref.path.includes('<') || ref.path.includes('{')) continue;
      if (/^https?:/.test(ref.path)) continue;
      // Skip prose-like fragments (I/O, A/B) and extensionless multi-segment words
      if (/^[A-Za-z]\/[A-Za-z]$/.test(ref.path)) continue;
      if (!/\.[a-z0-9]+$/i.test(ref.path) && !ref.path.endsWith('/') && !ref.path.startsWith('.')) {
        // require at least one known source-ish segment or a file extension
        if (!/(^|\/)(src|lib|bin|test|tests|docs|scripts|app|packages)\b/i.test(ref.path)) continue;
      }

      // Skip bare filenames that appear elsewhere in the index as approximate match
      if (!ref.path.includes('/') && !ref.path.includes('.')) continue;

      if (!project.exists(ref.path)) {
        // monorepo-ish prefix: downgrade
        const parts = ref.path.split('/');
        const maybeWarn = parts.length > 2;
        out.push({
          rule: 'stale-file-ref',
          severity: maybeWarn ? SEVERITY.WARN : SEVERITY.ERROR,
          line: ref.line,
          message: `references \`${ref.path}\` but this path does not exist`,
          suggestion: 'Update or remove the reference so agents are not misled.',
        });
      }
    }
    return out;
  },
};
