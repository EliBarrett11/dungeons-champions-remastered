import { describe, expect, it } from 'vitest';
import { parseDiceExpression, rollDiceExpression } from '../src/index';
import { ScriptedRng } from './support/scripted-rng';

describe('parseDiceExpression: valid expressions', () => {
  it.each([
    ['1d8', 1, 8, 0],
    ['2d8+13', 2, 8, 13],
    ['3d4+2', 3, 4, 2],
    ['1d4-8', 1, 4, -8],
    ['1d1', 1, 1, 0],
    ['1d8+0', 1, 8, 0],
    ['100d1000+1000000', 100, 1000, 1_000_000],
    ['1d6-1000000', 1, 6, -1_000_000],
  ])('%s -> %i dice of %i sides, modifier %i', (text, count, sides, modifier) => {
    expect(parseDiceExpression(text)).toEqual({ ok: true, value: { count, sides, modifier } });
  });

  it('1d8-0 has modifier exactly 0, not -0', () => {
    const result = parseDiceExpression('1d8-0');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.is(result.value.modifier, 0)).toBe(true);
    }
  });
});

describe('parseDiceExpression: invalid expressions', () => {
  it.each([
    ['', 'empty'],
    ['d8', 'missing count'],
    ['1d', 'missing sides'],
    ['0d6', 'zero dice'],
    ['1d0', 'zero sides'],
    ['01d6', 'leading zero in count'],
    ['1d06', 'leading zero in sides'],
    ['1d6+01', 'leading zero in modifier'],
    ['1D6', 'uppercase D'],
    [' 1d6', 'leading space'],
    ['1d6 ', 'trailing space'],
    ['1d6 + 2', 'inner spaces'],
    ['1d6+', 'sign without modifier'],
    ['1d6+-1', 'double sign'],
    ['1d6++1', 'double plus'],
    ['1d6*2', 'multiplication'],
    ['1d6+1d4', 'two dice terms'],
    ['2d6+3+1', 'two modifiers'],
    ['-1d6', 'negative count'],
    ['1.5d6', 'fractional count'],
    ['1d6+1.5', 'fractional modifier'],
    ['101d6', 'count above limit'],
    ['1d1001', 'sides above limit'],
    ['1d6+1000001', 'modifier above limit'],
    ['1d6-1000001', 'negative modifier above limit'],
    ['99999999999999999999d6', 'count far above limit'],
  ])('rejects %j (%s)', (text) => {
    const result = parseDiceExpression(text);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});

describe('rollDiceExpression', () => {
  it('rolls the dice in order and adds the modifier', () => {
    const rng = new ScriptedRng([0, 7]);
    expect(rollDiceExpression(rng, { count: 2, sides: 8, modifier: 3 })).toEqual({ dice: [1, 8], total: 12 });
    expect(rng.drawCount).toBe(2);
  });

  it('a negative modifier can make the total negative', () => {
    const rng = new ScriptedRng([2]);
    expect(rollDiceExpression(rng, { count: 1, sides: 4, modifier: -8 })).toEqual({ dice: [3], total: -5 });
  });
});
