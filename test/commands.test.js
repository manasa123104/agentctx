import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { check } from '../src/commands/check.js';
import { init } from '../src/commands/init.js';
import { mcp } from '../src/commands/mcp.js';

describe('commands', () => {
  it('init + check on a tiny project', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'agentctx-'));
    try {
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({ name: 'demo', scripts: { test: 'echo ok' } }),
      );
      const code = await init(dir, { format: 'agents', force: true });
      assert.equal(code, 0);
      const checkCode = await check(dir, { format: 'json', severity: 'error' });
      assert.equal(checkCode, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('mcp detects secrets', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'agentctx-mcp-'));
    try {
      writeFileSync(
        join(dir, '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            bad: { command: 'npx', env: { API_KEY: 'sk-not-a-real-key-but-pattern' } },
          },
        }),
      );
      const code = await mcp(dir, { format: 'json' });
      assert.equal(code, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
