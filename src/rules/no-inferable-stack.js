import { SEVERITY } from '../constants.js';

const STACK_PATTERNS = [
  /this\s+(is\s+)?(a\s+)?(typescript|javascript|react|next\.?js|node\.?js|python|rust|go)\b/i,
  /built\s+with\s+(react|vue|angular|svelte|express|fastapi|django|flask)/i,
  /uses?\s+(typescript|javascript|react|node)\s+\d+/i,
  /tech\s+stack\s*:/i,
];

export const noInferableStack = {
  name: 'no-inferable-stack',
  severity: SEVERITY.WARN,
  description: 'Tech stack descriptions discoverable from package manifests',
  run(parsed, project) {
    if (!project.packageJson && !project.hasCargo && !project.hasGoMod && !project.hasPython) {
      return [];
    }
    const out = [];
    parsed.lines.forEach((line, idx) => {
      if (STACK_PATTERNS.some((re) => re.test(line))) {
        out.push({
          rule: 'no-inferable-stack',
          severity: SEVERITY.WARN,
          line: idx + 1,
          message: `Inferable stack prose: "${line.trim().slice(0, 80)}${line.trim().length > 80 ? '…' : ''}"`,
          suggestion: 'Keep only non-obvious constraints (versions, quirks, required flags).',
        });
      }
    });
    return out;
  },
};
