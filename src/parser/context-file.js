/**
 * Lightweight context-file parser.
 * Extracts lines, fenced code blocks, backtick refs, and shell-like commands.
 */
export function parseContextFile(content) {
  const lines = content.split(/\r?\n/);
  const fileRefs = [];
  const commands = [];
  const codeBlocks = [];

  const pathRe =
    /(?:^|[\s`"'(])((?:\.\.?\/)?(?:[\w.-]+\/)+[\w.-]+(?:\.\w+)?|(?:[\w.-]+\.(?:js|ts|tsx|jsx|py|go|rs|md|json|yml|yaml|toml|sh|mjs|cjs)))(?=[\s`"''),:]|$)/g;
  const cmdRe =
    /(?:^|[\s`"'($])((?:npm|pnpm|yarn|bun|npx|cargo|go|make|uv|poetry|pytest|python|node)\s+[^\n`]+)/g;

  let inFence = false;
  let fenceStart = 0;
  let fenceLang = '';
  let fenceBody = [];

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (line.trim().startsWith('```')) {
      if (!inFence) {
        inFence = true;
        fenceStart = lineNo;
        fenceLang = line.trim().slice(3).trim();
        fenceBody = [];
      } else {
        codeBlocks.push({
          start: fenceStart,
          end: lineNo,
          lang: fenceLang,
          body: fenceBody.join('\n'),
        });
        inFence = false;
      }
      return;
    }
    if (inFence) {
      fenceBody.push(line);
      return;
    }

    let m;
    pathRe.lastIndex = 0;
    while ((m = pathRe.exec(line)) !== null) {
      const ref = m[1];
      if (ref.includes('http') || ref.startsWith('@')) continue;
      fileRefs.push({ path: ref, line: lineNo, text: line.trim() });
    }

    cmdRe.lastIndex = 0;
    while ((m = cmdRe.exec(line)) !== null) {
      commands.push({ command: m[1].trim(), line: lineNo, text: line.trim() });
    }
  });

  // Also harvest shell code blocks
  for (const block of codeBlocks) {
    if (!/^(sh|bash|shell|zsh|console|terminal)?$/i.test(block.lang || '')) continue;
    for (const raw of block.body.split('\n')) {
      const line = raw.replace(/^\$\s*/, '').trim();
      if (!line || line.startsWith('#')) continue;
      if (/^(npm|pnpm|yarn|bun|npx|cargo|go|make|uv|poetry|pytest|python|node)\b/.test(line)) {
        commands.push({ command: line, line: block.start, text: line });
      }
    }
  }

  return {
    content,
    lines,
    lineCount: lines.length,
    fileRefs,
    commands,
    codeBlocks,
  };
}
