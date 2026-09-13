import { SEVERITY, STYLE_GUIDE_PATTERNS } from '../constants.js';

export const noStyleGuide = {
  name: 'no-style-guide',
  severity: SEVERITY.INFO,
  description: 'Style rules that belong in a linter config, not a context file',
  run(parsed, project) {
    if (project.linterConfigs.length === 0) return [];
    const out = [];
    parsed.lines.forEach((line, idx) => {
      if (STYLE_GUIDE_PATTERNS.some((re) => re.test(line))) {
        out.push({
          rule: 'no-style-guide',
          severity: SEVERITY.INFO,
          line: idx + 1,
          message: `"${line.trim().slice(0, 72)}" — tooling already enforces style`,
          suggestion: `Found configs: ${project.linterConfigs.join(', ')}. Prefer formatter/linter over prose.`,
        });
      }
    });
    return out;
  },
};
