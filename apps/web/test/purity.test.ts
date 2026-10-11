import { describe, expect, it } from 'vitest';

// M2: the game layer (src/game) imports nothing from the DOM, Node I/O or clocks,
// and never uses ambient randomness (P-009); only src/ui may touch the browser.
const sources = import.meta.glob<string>('../src/game/**/*.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const NODE_BUILTINS = [
  'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns', 'events',
  'fs', 'http', 'http2', 'https', 'module', 'net', 'os', 'path', 'perf_hooks',
  'process', 'readline', 'stream', 'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm',
  'worker_threads', 'zlib',
];

const FORBIDDEN: { name: string; pattern: RegExp }[] = [
  { name: 'node: import', pattern: /\bfrom\s+['"]node:|\bimport\s*\(\s*['"]node:|\brequire\s*\(/ },
  {
    name: 'Node built-in import',
    pattern: new RegExp(`\\bfrom\\s+['"](?:${NODE_BUILTINS.join('|')})(?:/[^'"]*)?['"]`),
  },
  { name: 'Math.random', pattern: /\bMath\s*\.\s*random\b/ },
  { name: 'Date', pattern: /\bDate\b/ },
  { name: 'performance', pattern: /\bperformance\b/ },
  { name: 'process', pattern: /\bprocess\b/ },
  { name: 'timers', pattern: /\b(?:setTimeout|setInterval|setImmediate|queueMicrotask)\b/ },
  { name: 'window', pattern: /\bwindow\b/ },
  { name: 'document', pattern: /\bdocument\b/ },
  { name: 'globalThis', pattern: /\bglobalThis\b/ },
];

function violations(source: string): string[] {
  return FORBIDDEN.filter(({ pattern }) => pattern.test(source)).map(({ name }) => name);
}

describe('game-layer purity scan', () => {
  it('scans the game-layer source files', () => {
    expect(Object.keys(sources).length).toBeGreaterThanOrEqual(2);
  });

  it.each(Object.entries(sources))('%s uses no forbidden API', (_path, source) => {
    expect(violations(source)).toEqual([]);
  });

  it('detects each forbidden pattern (scanner self-test)', () => {
    const samples: Record<string, string> = {
      'node: import': "import { readFileSync } from 'node:fs';",
      'Node built-in import': "import { createHash } from 'crypto';",
      'Math.random': 'const x = Math.random();',
      Date: 'const now = Date.now();',
      performance: 'performance.now();',
      process: 'process.env.SEED;',
      timers: 'setTimeout(run, 0);',
      window: 'window.alert(1);',
      document: 'document.title;',
      globalThis: 'globalThis.crypto;',
    };
    for (const [name, sample] of Object.entries(samples)) {
      expect(violations(sample)).toContain(name);
    }
  });

  it('does not flag ordinary identifiers that merely contain a forbidden word', () => {
    expect(violations('const updatedAt = 1; const randomness = 2; // processed')).toEqual([]);
  });
});
