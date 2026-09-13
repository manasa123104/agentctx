import { SEVERITY, THRESHOLDS } from '../constants.js';

function trigrams(text) {
  const norm = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const set = new Set();
  for (let i = 0; i < norm.length - 2; i++) set.add(norm.slice(i, i + 3));
  return set;
}

function overlap(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / Math.min(a.size, b.size);
}

export const redundantReadme = {
  name: 'redundant-readme',
  severity: SEVERITY.WARN,
  description: 'Content that heavily duplicates README.md',
  run(parsed, project) {
    if (!project.readme || project.readme.length < 200) return [];
    const score = overlap(trigrams(parsed.content), trigrams(project.readme));
    if (score < 0.4) return [];
    return [
      {
        rule: 'redundant-readme',
        severity: SEVERITY.WARN,
        line: 1,
        message: `High overlap with README.md (${Math.round(score * 100)}% trigram overlap)`,
        suggestion: 'Remove duplicated intro/install prose; point agents at README instead.',
        meta: { overlap: score, charsPerToken: 1 / THRESHOLDS.TOKENS_PER_CHAR },
      },
    ];
  },
};
