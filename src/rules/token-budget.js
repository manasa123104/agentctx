import { SEVERITY, THRESHOLDS } from '../constants.js';

export const tokenBudget = {
  name: 'token-budget',
  severity: SEVERITY.WARN,
  description: 'Estimate token cost and signal-to-noise from other diagnostics',
  run(parsed, _project, otherDiagnostics = [], thresholds = {}) {
    const chars = parsed.content.length;
    const tokens = Math.round(chars * THRESHOLDS.TOKENS_PER_CHAR);
    const noisy = otherDiagnostics.filter((d) => d.severity === 'error' || d.severity === 'warn');
    const noiseRatio = parsed.lineCount === 0 ? 0 : Math.min(1, noisy.length / Math.max(1, parsed.lineCount / 20));
    const snr = Math.max(0, 1 - noiseRatio);

    const infoAt = thresholds.info ?? 500;
    const warnAt = thresholds.warning ?? 2000;
    const errorAt = thresholds.error ?? 5000;

    let severity = SEVERITY.INFO;
    if (tokens >= errorAt) severity = SEVERITY.ERROR;
    else if (tokens >= warnAt || snr < 0.5) severity = SEVERITY.WARN;
    else if (tokens >= infoAt) severity = SEVERITY.INFO;
    else return [];

    const quality =
      snr >= 0.75 ? 'good' : snr >= 0.5 ? 'fair' : 'poor';

    return [
      {
        rule: 'token-budget',
        severity,
        line: 1,
        message: `Context file: ${parsed.lineCount} lines, ~${tokens} tokens — signal-to-noise ${snr.toFixed(2)} (${quality})`,
        suggestion: 'Fix errors/warnings first, then re-run check to improve SNR.',
      },
    ];
  },
};
