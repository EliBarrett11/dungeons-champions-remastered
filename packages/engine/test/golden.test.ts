import { describe, expect, it } from 'vitest';
import { canonicalJson, runBattle, serializeEvents } from '../src/index';
import { GOLDEN_EXPECTED, GOLDEN_INPUTS } from './golden/fixtures';
import { sha256Hex } from './support/sha256';

const LOG_FILES = import.meta.glob<string>('./golden/*.log.json', { eager: true, query: '?raw', import: 'default' });

function goldenLog(name: string): string {
  const file = LOG_FILES[`./golden/${name}.log.json`];
  if (file === undefined) throw new Error(`missing golden log for ${name}`);
  return file;
}

describe('golden replays', () => {
  it('every fixture has a log file and recorded expectations, and nothing extra', () => {
    const names = Object.keys(GOLDEN_INPUTS).sort();
    expect(Object.keys(GOLDEN_EXPECTED).sort()).toEqual(names);
    expect(Object.keys(LOG_FILES).map((p) => p.replace('./golden/', '').replace('.log.json', '')).sort()).toEqual(names);
  });

  for (const [name, input] of Object.entries(GOLDEN_INPUTS)) {
    describe(name, () => {
      const result = runBattle(input);
      const expected = GOLDEN_EXPECTED[name]!;

      it('reproduces the recorded event log exactly', () => {
        expect(serializeEvents(result.events)).toBe(canonicalJson(JSON.parse(goldenLog(name))));
      });

      it('reproduces the recorded hash, outcome, end time and event count', () => {
        expect(sha256Hex(serializeEvents(result.events))).toBe(expected.sha256);
        expect(result.outcome).toEqual(expected.outcome);
        expect(result.endTimeMs).toBe(expected.endTimeMs);
        expect(result.events).toHaveLength(expected.eventCount);
      });

      it('the log file lists exactly one canonical event per line', () => {
        const lines = goldenLog(name).trim().split('\n');
        expect(lines[0]).toBe('[');
        expect(lines.at(-1)).toBe(']');
        const body = lines.slice(1, -1).map((line) => line.replace(/,$/, ''));
        expect(body.map((line) => canonicalJson(JSON.parse(line)))).toEqual(body);
        expect(body).toHaveLength(expected.eventCount);
      });
    });
  }
});
