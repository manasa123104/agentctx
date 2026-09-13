import { SEVERITY } from '../constants.js';

// Real tree glyphs / box-drawing — do NOT treat markdown "-" bullets as trees
const TREE_GLYPH = /[│├└─┌┐┘┴┬┤╠╣║═╔╗╚╝]/;
const TREE_PREFIX = /^\s{0,6}(?:├──|└──|│\s{2}|├\s|└\s)/;

export const noDirectoryTree = {
  name: 'no-directory-tree',
  severity: SEVERITY.ERROR,
  description: 'Embedded directory trees waste tokens; agents can explore the filesystem',
  run(parsed) {
    const hits = [];
    let runStart = null;
    let runCount = 0;

    parsed.lines.forEach((line, idx) => {
      const isTree =
        TREE_PREFIX.test(line) ||
        (TREE_GLYPH.test(line) && /[\w./-]+/.test(line));

      if (isTree) {
        if (runStart == null) runStart = idx + 1;
        runCount += 1;
      } else if (runStart != null) {
        if (runCount >= 3) {
          hits.push({
            rule: 'no-directory-tree',
            severity: SEVERITY.ERROR,
            line: runStart,
            message: `Lines ${runStart}-${runStart + runCount - 1} look like a directory tree (${runCount} lines)`,
            suggestion: 'Delete the tree. Agents discover structure with ls/find.',
          });
        }
        runStart = null;
        runCount = 0;
      }
    });

    if (runStart != null && runCount >= 3) {
      hits.push({
        rule: 'no-directory-tree',
        severity: SEVERITY.ERROR,
        line: runStart,
        message: `Lines ${runStart}-${runStart + runCount - 1} look like a directory tree (${runCount} lines)`,
        suggestion: 'Delete the tree. Agents discover structure with ls/find.',
      });
    }

    return hits;
  },
};
