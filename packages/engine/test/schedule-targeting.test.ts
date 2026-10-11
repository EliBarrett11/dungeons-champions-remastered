import { describe, expect, it } from 'vitest';
import { nextMoment, rowOfSlot, selectTarget } from '../src/index';

const BOUNDARIES = [30_000, 35_000, 40_000, 45_000, 50_000, 55_000];
const HARD_STOP = 60_000;

describe('nextMoment (revised M1 plan section 5)', () => {
  it('an attack timer before the next boundary comes first', () => {
    expect(nextMoment([29_222], BOUNDARIES, HARD_STOP)).toEqual({ kind: 'moment', t: 29_222, boundary: false, attacks: true });
  });

  it('a boundary before the next attack timer is a boundary-only moment', () => {
    expect(nextMoment([30_760], BOUNDARIES, HARD_STOP)).toEqual({ kind: 'moment', t: 30_000, boundary: true, attacks: false });
  });

  it('an attack timer exactly at a boundary is one moment with both', () => {
    expect(nextMoment([30_000, 31_000], BOUNDARIES, HARD_STOP)).toEqual({ kind: 'moment', t: 30_000, boundary: true, attacks: true });
  });

  it('59,999 is still a moment; 60,000 is the hard stop', () => {
    expect(nextMoment([59_999, 60_000], [], HARD_STOP)).toEqual({ kind: 'moment', t: 59_999, boundary: false, attacks: true });
    expect(nextMoment([60_000], [], HARD_STOP)).toEqual({ kind: 'hardStop', t: 60_000 });
  });

  it('timers beyond the hard stop stop the battle at exactly 60,000', () => {
    expect(nextMoment([70_000, 1_000_000], [], HARD_STOP)).toEqual({ kind: 'hardStop', t: 60_000 });
  });

  it('[synthetic scheduler unit test] no living timers but boundaries pending: boundaries, then the hard stop', () => {
    // Synthetic: in a real battle a side with no living Champion has already ended the battle.
    expect(nextMoment([], [55_000], HARD_STOP)).toEqual({ kind: 'moment', t: 55_000, boundary: true, attacks: false });
    expect(nextMoment([], [], HARD_STOP)).toEqual({ kind: 'hardStop', t: 60_000 });
  });
});

describe('rowOfSlot (I-1)', () => {
  it.each([[0, 0], [2, 0], [3, 1], [6, 1], [7, 2], [11, 2]])('slot %i is in row %i', (slot, row) => {
    expect(rowOfSlot(slot)).toBe(row);
  });

  it.each([-1, 12, 1.5])('rejects slot %s', (slot) => {
    expect(() => rowOfSlot(slot)).toThrow(RangeError);
  });
});

describe('selectTarget (P-003, P-016, I-8)', () => {
  const enemies = [
    { id: 'back', slot: 8, defeated: false },
    { id: 'middle-high', slot: 6, defeated: false },
    { id: 'middle-low', slot: 4, defeated: false },
  ];

  it('chooses the frontmost occupied row, then the lowest slot', () => {
    expect(selectTarget(null, enemies)).toBe('middle-low');
  });

  it('keeps the current target while it is not defeated, even if another enemy would be chosen first', () => {
    expect(selectTarget('back', enemies)).toBe('back');
  });

  it('retargets when the current target is defeated', () => {
    expect(selectTarget('middle-low', enemies.map((e) => (e.id === 'middle-low' ? { ...e, defeated: true } : e)))).toBe('middle-high');
  });

  it('a row holding only defeated Champions counts as unoccupied', () => {
    const front = [{ id: 'front', slot: 0, defeated: true }, { id: 'back', slot: 9, defeated: false }];
    expect(selectTarget(null, front)).toBe('back');
  });

  it('returns null when no enemy is alive', () => {
    expect(selectTarget('x', [{ id: 'x', slot: 0, defeated: true }])).toBeNull();
    expect(selectTarget(null, [])).toBeNull();
  });
});
