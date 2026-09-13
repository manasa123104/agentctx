import { ANSI } from '../constants.js';

const ICON = {
  error: `${ANSI.RED}✗${ANSI.RESET}`,
  warn: `${ANSI.YELLOW}⚠${ANSI.RESET}`,
  info: `${ANSI.BLUE}ℹ${ANSI.RESET}`,
};

export function reportTerminal(diagnostics, fileName) {
  console.log(`\n${ANSI.BOLD}${fileName}${ANSI.RESET}\n`);
  if (diagnostics.length === 0) {
    console.log(`  ${ANSI.GREEN}✓ clean${ANSI.RESET}\n`);
    return;
  }

  for (const d of diagnostics) {
    const loc = d.line ? `L${d.line}` : d.server ? `${d.server}${d.field ? '.' + d.field : ''}` : '';
    console.log(`  ${ICON[d.severity] || '•'} ${ANSI.BOLD}${d.rule}${ANSI.RESET}  ${loc}  ${d.message}`);
    if (d.suggestion) {
      console.log(`     ${ANSI.GRAY}${d.suggestion}${ANSI.RESET}`);
    }
  }

  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = diagnostics.filter((d) => d.severity === 'warn').length;
  const info = diagnostics.filter((d) => d.severity === 'info').length;
  console.log(`\nSummary: ${errors} errors, ${warnings} warnings, ${info} info\n`);
}

export function reportJson(diagnostics, fileName) {
  const summary = {
    errors: diagnostics.filter((d) => d.severity === 'error').length,
    warnings: diagnostics.filter((d) => d.severity === 'warn').length,
    info: diagnostics.filter((d) => d.severity === 'info').length,
  };
  console.log(JSON.stringify({ file: fileName, diagnostics, summary }, null, 2));
}

let sarifRuns = [];

export function reportSarif(diagnostics, fileName, filePath) {
  const results = diagnostics.map((d) => ({
    ruleId: d.rule,
    level: d.severity === 'error' ? 'error' : d.severity === 'warn' ? 'warning' : 'note',
    message: { text: d.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: filePath || fileName },
          region: { startLine: d.line || 1 },
        },
      },
    ],
  }));
  sarifRuns.push(...results);
}

export function flushSarif() {
  const doc = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'agentctx',
            informationUri: 'https://github.com/manasa123104/agentctx',
            rules: [],
          },
        },
        results: sarifRuns,
      },
    ],
  };
  console.log(JSON.stringify(doc, null, 2));
  sarifRuns = [];
}
