import { describe, expect, it } from 'vitest';
import { M1_CONFIG } from '@dc/engine';
import { EXPEDITION_CONFIG, boardRows, formationProblems, isLegalSlot, rowName } from '../src/game/index';

describe('board layout (P-003, I-1)', () => {
  it('has front 0-2, middle 3-6 and back 7-11, taken from the engine config', () => {
    expect(boardRows()).toEqual([
      { row: 'front', slots: [0, 1, 2] },
      { row: 'middle', slots: [3, 4, 5, 6] },
      { row: 'back', slots: [7, 8, 9, 10, 11] },
    ]);
    expect(boardRows().flatMap((r) => r.slots)).toHaveLength(M1_CONFIG.boardSlots);
  });

  it('names rows at their boundaries', () => {
    expect([0, 2, 3, 6, 7, 11].map(rowName)).toEqual(['front', 'front', 'middle', 'middle', 'back', 'back']);
  });

  it('accepts only integer slots 0-11', () => {
    expect([0, 5, 11].every(isLegalSlot)).toBe(true);
    expect([-1, 12, 1.5, Number.NaN].some(isLegalSlot)).toBe(false);
  });
});

describe('formationProblems', () => {
  const bench = ['c1', 'c2', 'c3', 'c4'];

  it('accepts 1 to 3 Champions in distinct legal slots', () => {
    expect(formationProblems([{ instanceId: 'c1', slot: 0 }], bench)).toEqual([]);
    expect(
      formationProblems([{ instanceId: 'c1', slot: 0 }, { instanceId: 'c2', slot: 6 }, { instanceId: 'c3', slot: 11 }], bench),
    ).toEqual([]);
  });

  it('rejects an empty team', () => {
    expect(formationProblems([], bench)).toEqual(['Place at least 1 Champion on the board.']);
  });

  it(`rejects more than ${EXPEDITION_CONFIG.maxTeamSize} Champions`, () => {
    const four = bench.map((instanceId, slot) => ({ instanceId, slot }));
    expect(formationProblems(four, bench)).toEqual(['At most 3 Champions can be fielded (you have 4).']);
  });

  it('rejects illegal slots, shared slots, duplicates and unowned Champions', () => {
    expect(formationProblems([{ instanceId: 'c1', slot: 12 }], bench)).toEqual(['Slot 12 is not a board slot (0-11).']);
    expect(formationProblems([{ instanceId: 'c1', slot: 2 }, { instanceId: 'c2', slot: 2 }], bench)).toEqual([
      'Slot 2 holds more than one Champion.',
    ]);
    expect(formationProblems([{ instanceId: 'c1', slot: 2 }, { instanceId: 'c1', slot: 3 }], bench)).toEqual([
      'Champion c1 is placed more than once.',
    ]);
    expect(formationProblems([{ instanceId: 'x9', slot: 2 }], bench)).toEqual(['Champion x9 is not on your bench.']);
  });
});
