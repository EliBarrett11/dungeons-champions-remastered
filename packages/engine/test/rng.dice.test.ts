import { describe, expect, it } from 'vitest';
import { BattleRng, rollDice, rollDie } from '../src/index';
import { ScriptedRng } from './support/scripted-rng';

const MAX = 0xffff_ffff; // 2^32 - 1

describe('rejection-sampling boundaries (scripted outputs)', () => {
  // d20: 2^32 mod 20 = 16, so limit = 4294967280; outputs >= limit are rejected.
  it('d20 accepts the last value below the limit', () => {
    const rng = new ScriptedRng([4294967279]);
    expect(rollDie(rng, 20)).toBe(20); // 4294967279 mod 20 = 19
    expect(rng.drawCount).toBe(1);
  });

  it('d20 rejects the limit itself and redraws', () => {
    const rng = new ScriptedRng([4294967280, 0]);
    expect(rollDie(rng, 20)).toBe(1);
    expect(rng.drawCount).toBe(2);
  });

  it('d20 rejects every value from the limit to 2^32 - 1, consuming one output each', () => {
    const rejected = Array.from({ length: 16 }, (_, i) => 4294967280 + i);
    const rng = new ScriptedRng([...rejected, 39]);
    expect(rollDie(rng, 20)).toBe(20); // 39 mod 20 = 19
    expect(rng.drawCount).toBe(17);
  });

  it('d20 maps 0 to face 1 and 19 to face 20', () => {
    expect(rollDie(new ScriptedRng([0]), 20)).toBe(1);
    expect(rollDie(new ScriptedRng([19]), 20)).toBe(20);
  });

  // d6: 2^32 mod 6 = 4, so limit = 4294967292.
  it('d6 accepts limit - 1 and rejects limit .. 2^32 - 1', () => {
    expect(rollDie(new ScriptedRng([4294967291]), 6)).toBe(6); // 4294967291 mod 6 = 5
    const rng = new ScriptedRng([4294967292, 4294967293, 4294967294, MAX, 7]);
    expect(rollDie(rng, 6)).toBe(2); // 7 mod 6 = 1
    expect(rng.drawCount).toBe(5);
  });

  // d8: 2^32 is divisible by 8, so nothing is rejected.
  it('d8 never rejects: 2^32 - 1 maps to face 8 in one draw', () => {
    const rng = new ScriptedRng([MAX]);
    expect(rollDie(rng, 8)).toBe(8);
    expect(rng.drawCount).toBe(1);
  });

  it('a one-sided die consumes exactly one output, whatever its value', () => {
    for (const u of [0, 1, 2147483648, MAX]) {
      const rng = new ScriptedRng([u]);
      expect(rollDie(rng, 1)).toBe(1);
      expect(rng.drawCount).toBe(1);
    }
  });

  it('a one-sided die consumes exactly one real generator output per roll', () => {
    const rng = new BattleRng(42);
    rollDice(rng, 25, 1);
    expect(rng.drawCount).toBe(25);
  });
});

describe('dice against the independent reference', () => {
  it('seed 12345: ten d20 rolls', () => {
    const rng = new BattleRng(12345);
    expect(rollDice(rng, 10, 20)).toEqual([11, 4, 4, 4, 2, 7, 5, 12, 13, 1]);
    expect(rng.drawCount).toBe(10);
  });

  it('seed 3735928559: ten d20 rolls', () => {
    const rng = new BattleRng(3735928559);
    expect(rollDice(rng, 10, 20)).toEqual([5, 1, 18, 8, 1, 5, 3, 9, 20, 10]);
    expect(rng.drawCount).toBe(10);
  });

  it('seed 12345: 100,000 d6 rolls sum to 350552 using 100000 draws', () => {
    const rng = new BattleRng(12345);
    const sum = rollDice(rng, 100_000, 6).reduce((total, face) => total + face, 0);
    expect(sum).toBe(350552);
    expect(rng.drawCount).toBe(100_000);
  });

  it('seed 777: 100,000 d7 rolls sum to 399412 using 100000 draws', () => {
    const rng = new BattleRng(777);
    const sum = rollDice(rng, 100_000, 7).reduce((total, face) => total + face, 0);
    expect(sum).toBe(399412);
    expect(rng.drawCount).toBe(100_000);
  });
});

describe('die results', () => {
  it('every d20 face appears, each within 5% of its expected count over 200,000 rolls', () => {
    const counts = new Array<number>(21).fill(0);
    const rng = new BattleRng(2024);
    for (let i = 0; i < 200_000; i++) {
      counts[rollDie(rng, 20)]! += 1;
    }
    for (let face = 1; face <= 20; face++) {
      expect(Math.abs(counts[face]! - 10_000)).toBeLessThan(500);
    }
    expect(counts[0]).toBe(0);
  });

  it('rollDice returns dice in order and consumes them in order', () => {
    const rng = new ScriptedRng([0, 1, 2]);
    expect(rollDice(rng, 3, 8)).toEqual([1, 2, 3]);
  });
});

describe('argument validation', () => {
  it.each([0, -1, 1.5, Number.NaN, 2 ** 32 + 1])('rollDie rejects %s sides', (sides) => {
    expect(() => rollDie(new ScriptedRng([0]), sides)).toThrow(RangeError);
  });

  it('rollDie accepts 2^32 sides and draws once', () => {
    const rng = new ScriptedRng([MAX]);
    expect(rollDie(rng, 2 ** 32)).toBe(2 ** 32);
    expect(rng.drawCount).toBe(1);
  });

  it.each([0, -1, 2.5])('rollDice rejects a count of %s without drawing', (count) => {
    const rng = new ScriptedRng([]);
    expect(() => rollDice(rng, count, 6)).toThrow(RangeError);
    expect(rng.drawCount).toBe(0);
  });
});
