import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { LINTER_CONFIGS, PACKAGE_MANAGERS } from '../constants.js';

function safeReadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function listFiles(dir, depth = 0, maxDepth = 3, acc = new Set()) {
  if (depth > maxDepth || !existsSync(dir)) return acc;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === 'coverage') {
      continue;
    }
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      acc.add(entry + '/');
      listFiles(full, depth + 1, maxDepth, acc);
    } else {
      acc.add(entry);
    }
  }
  return acc;
}

function parseMakefileTargets(content) {
  const targets = new Set();
  for (const line of content.split('\n')) {
    const m = line.match(/^([a-zA-Z0-9_-]+)\s*:/);
    if (m && !m[1].startsWith('.')) targets.add(m[1]);
  }
  return [...targets];
}

export function scanProject(projectDir) {
  const pkgPath = join(projectDir, 'package.json');
  const packageJson = existsSync(pkgPath) ? safeReadJson(pkgPath) : null;
  const scripts = packageJson?.scripts ? Object.keys(packageJson.scripts) : [];

  let packageManager = null;
  for (const [lock, pm] of Object.entries(PACKAGE_MANAGERS)) {
    if (existsSync(join(projectDir, lock))) {
      packageManager = pm;
      break;
    }
  }

  const hasCargo = existsSync(join(projectDir, 'Cargo.toml'));
  const hasGoMod = existsSync(join(projectDir, 'go.mod'));
  const hasPyproject = existsSync(join(projectDir, 'pyproject.toml'));
  const hasPython =
    hasPyproject ||
    existsSync(join(projectDir, 'requirements.txt')) ||
    existsSync(join(projectDir, 'setup.py'));

  const makefilePath = join(projectDir, 'Makefile');
  const makefileTargets = existsSync(makefilePath)
    ? parseMakefileTargets(readFileSync(makefilePath, 'utf8'))
    : [];

  const linterConfigs = LINTER_CONFIGS.filter((f) => existsSync(join(projectDir, f)));

  const readmePath = join(projectDir, 'README.md');
  const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '';

  const workflowsDir = join(projectDir, '.github', 'workflows');
  const workflows = [];
  if (existsSync(workflowsDir)) {
    for (const f of readdirSync(workflowsDir)) {
      if (f.endsWith('.yml') || f.endsWith('.yaml')) workflows.push(f);
    }
  }

  const fileIndex = listFiles(projectDir);

  return {
    root: projectDir,
    packageJson,
    scripts,
    packageManager,
    hasCargo,
    hasGoMod,
    hasPython,
    hasPyproject,
    makefileTargets,
    linterConfigs,
    readme,
    workflows,
    fileIndex,
    exists: (rel) => {
      const clean = rel.replace(/^\.\//, '').replace(/\\/g, '/');
      return existsSync(join(projectDir, clean));
    },
  };
}
