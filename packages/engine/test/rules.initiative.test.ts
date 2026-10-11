import { describe, expect, it } from 'vitest';
import { initiativeTotal, openingUltimateWinners, skipsFirstAttack } from '../src/index';

describe('initiativeTotal (P-008, C-001)', () => {
  it('adds the natural d20 and the modifier', () => {
    expect(initiativeTotal(14, 3)).toBe(17);
    expect(initiativeTotal(1, -2)).toBe(-1);
    expect(initiativeTotal(20, 0)).toBe(20);
  });

  it.each([0, 21, 2.5])('rejects natural roll %s', (natural) => {
    expect(() => initiativeTotal(natural, 0)).toThrow(RangeError);
  });

  it('rejects a non-integer modifier', () => {
    expect(() => initiativeTotal(10, 0.5)).toThrow(RangeError);
  });
});

describe('skipsFirstAttack (P-008)', () => {
  // The ruleset's own examples (PROTOTYPE_RULESET_V0.md section 6).
  it('totals 1, 2, 2, 3: only the Champion with 1 skips', () => {
    expect(skipsFirstAttack([1, 2, 2, 3])).toEqual([true, false, false, false]);
  });

  it('totals 1, 1, 2, 3: both Champions with 1 skip', () => {
    expect(skipsFirstAttack([1, 1, 2, 3])).toEqual([true, true, false, false]);
  });

  it('N = 1: nobody skips', () => {
    expect(skipsFirstAttack([5])).toEqual([false]);
  });

  it('N = 2: the lower total skips; a tie means nobody skips', () => {
    expect(skipsFirstAttack([3, 2])).toEqual([false, true]);
    expect(skipsFirstAttack([3, 3])).toEqual([false, false]);
  });

  it('N = 3 (k = 1): the single lowest skips; ties at the bottom do not', () => {
    expect(skipsFirstAttack([1, 2, 3])).toEqual([true, false, false]);
    expect(skipsFirstAttack([1, 1, 3])).toEqual([false, false, false]);
    expect(skipsFirstAttack([2, 2, 2])).toEqual([false, false, false]);
  });

  it('N = 4 with all totals equal: nobody skips', () => {
    expect(skipsFirstAttack([7, 7, 7, 7])).toEqual([false, false, false, false]);
  });

  it('N = 5 (k = 2): three tied lowest totals exceed k, so none of them skip', () => {
    expect(skipsFirstAttack([1, 1, 1, 9, 9])).toEqual([false, false, false, false, false]);
  });

  it('N = 10 (k = 5): exactly the five lowest distinct totals skip', () => {
    const totals = [10, 1, 9, 2, 8, 3, 7, 4, 6, 5];
    expect(skipsFirstAttack(totals)).toEqual(totals.map((t) => t <= 5));
  });

  it('result does not depend on the order totals are listed in', () => {
    const totals = [4, 1, 3, 1, 2];
    const flags = skipsFirstAttack(totals);
    const reversed = skipsFirstAttack([...totals].reverse());
    expect(reversed).toEqual([...flags].reverse());
  });

  it('negative totals are ranked the same way', () => {
    expect(skipsFirstAttack([-1, 0, 5, 6])).toEqual([true, true, false, false]);
  });
});

describe('openingUltimateWinners (C-001, C-002)', () => {
  it('the single highest total wins', () => {
    expect(openingUltimateWinners([5, 9, 3])).toEqual([1]);
  });

  it('every Champion tied for highest wins', () => {
    expect(openingUltimateWinners([5, 7, 7, 3])).toEqual([1, 2]);
  });

  it('all tied: everyone wins', () => {
    expect(openingUltimateWinners([4, 4])).toEqual([0, 1]);
  });

  it('no Champions: no winners', () => {
    expect(openingUltimateWinners([])).toEqual([]);
  });
});
