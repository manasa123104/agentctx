import { SEVERITY } from '../constants.js';

export const ciCoverage = {
  name: 'ci-coverage',
  severity: SEVERITY.INFO,
  description: 'CI workflows not mentioned in the context file',
  run(parsed, project) {
    if (!project.workflows || project.workflows.length === 0) return [];
    const text = parsed.content.toLowerCase();
    const missing = project.workflows.filter((w) => {
      const stem = w.replace(/\.(yml|yaml)$/i, '').toLowerCase();
      return !text.includes(stem) && !text.includes(w.toLowerCase()) && !text.includes('ci');
    });
    if (missing.length === 0) return [];
    return [
      {
        rule: 'ci-coverage',
        severity: SEVERITY.INFO,
        line: 1,
        message: `CI workflows not mentioned: ${missing.join(', ')}`,
        suggestion: 'Optionally document how agents should interpret CI failures.',
      },
    ];
  },
};
