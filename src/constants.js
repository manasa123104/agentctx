export const CONTEXT_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.github/copilot-instructions.md',
  '.windsurfrules',
  '.clinerules',
  '.aiderules',
  'CONVENTIONS.md',
  '.cursorrules',
];

export const MCP_CONFIG_PATHS = [
  '.mcp.json',
  '.cursor/mcp.json',
  '.vscode/mcp.json',
  '.amazonq/mcp.json',
];

export const SEVERITY = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
};

export const SEVERITY_RANK = { info: 0, warn: 1, error: 2 };

export const THRESHOLDS = {
  MAX_LINES_WARN: 200,
  MAX_LINES_ERROR: 400,
  TOKENS_PER_CHAR: 0.25,
};

export const ANSI = {
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  GREEN: '\x1b[32m',
  GRAY: '\x1b[90m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  RESET: '\x1b[0m',
};

export const PACKAGE_MANAGERS = {
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  'bun.lockb': 'bun',
  'bun.lock': 'bun',
};

export const LINTER_CONFIGS = [
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.json',
  'eslint.config.js',
  'eslint.config.mjs',
  '.prettierrc',
  '.prettierrc.json',
  'prettier.config.js',
  'biome.json',
  'ruff.toml',
  'rustfmt.toml',
  '.editorconfig',
];

export const STYLE_GUIDE_PATTERNS = [
  /use\s+(camelCase|snake_case|PascalCase|kebab-case)/i,
  /indent\s+(with|using)\s+\d+\s+(spaces?|tabs?)/i,
  /prefer\s+(const|let|var)\s+(over|instead)/i,
  /(always|never)\s+use\s+semicolons?/i,
  /use\s+(single|double)\s+quotes?/i,
  /trailing\s+commas?/i,
  /max(imum)?\s+(line\s+)?length/i,
];
