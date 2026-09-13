import { SEVERITY, THRESHOLDS } from '../constants.js';

export const maxLines = {
  name: 'max-lines',
  severity: SEVERITY.WARN,
  description: 'Context files over ~200 lines are usually bloated',
  run(parsed) {
    const n = parsed.lineCount;
    if (n <= THRESHOLDS.MAX_LINES_WARN) return [];
    const severity = n >= THRESHOLDS.MAX_LINES_ERROR ? SEVERITY.ERROR : SEVERITY.WARN;
    return [
      {
        rule: 'max-lines',
        severity,
        line: 1,
        message: `Context file has ${n} lines (warn > ${THRESHOLDS.MAX_LINES_WARN}, error > ${THRESHOLDS.MAX_LINES_ERROR})`,
        suggestion: 'Keep only non-inferable constraints. Run `agentctx slim` after fixing errors.',
      },
    ];
  },
};
