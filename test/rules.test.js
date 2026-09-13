import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseContextFile } from '../src/parser/context-file.js';
import { noDirectoryTree } from '../src/rules/no-directory-tree.js';
import { staleCommand } from '../src/rules/stale-command.js';
import { maxLines } from '../src/rules/max-lines.js';
import { mcpHardcodedSecret, mcpSchema } from '../src/rules/mcp/index.js';

describe('parseContextFile', () => {
  it('extracts file refs and commands', () => {
    const parsed = parseContextFile('See `src/foo.js`\nRun `npm run build`\n');
    assert.ok(parsed.fileRefs.some((r) => r.path.includes('src/foo.js')));
    assert.ok(parsed.commands.some((c) => c.command.includes('npm run build')));
  });
});

describe('no-directory-tree', () => {
  it('flags ascii trees', () => {
    const body = ['# Tree', 'src/', '├── a.js', '├── b.js', '└── c.js', ''].join('\n');
    const diags = noDirectoryTree.run(parseContextFile(body));
    assert.ok(diags.some((d) => d.rule === 'no-directory-tree'));
  });
});

describe('stale-command', () => {
  it('flags missing npm scripts', () => {
    const parsed = parseContextFile('Run `npm run missing-script`\n');
    const project = {
      packageJson: { scripts: { test: 'node --test' } },
      scripts: ['test'],
      hasCargo: false,
      hasGoMod: false,
      hasPython: false,
      makefileTargets: [],
    };
    const diags = staleCommand.run(parsed, project);
    assert.equal(diags.length, 1);
    assert.equal(diags[0].rule, 'stale-command');
  });
});

describe('max-lines', () => {
  it('warns when over threshold', () => {
    const lines = Array.from({ length: 220 }, (_, i) => `line ${i}`).join('\n');
    const diags = maxLines.run(parseContextFile(lines));
    assert.equal(diags[0].severity, 'warn');
  });
});

describe('mcp rules', () => {
  it('flags missing mcpServers', () => {
    const diags = mcpSchema.run({ name: '.mcp.json', json: {}, parseError: false });
    assert.ok(diags.some((d) => d.rule === 'mcp-schema'));
  });

  it('flags hardcoded secrets', () => {
    const diags = mcpHardcodedSecret.run({
      name: '.mcp.json',
      json: {
        mcpServers: {
          openai: { command: 'npx', env: { OPENAI_API_KEY: 'sk-abc123secret' } },
        },
      },
    });
    assert.ok(diags.some((d) => d.rule === 'mcp-hardcoded-secret'));
  });
});
