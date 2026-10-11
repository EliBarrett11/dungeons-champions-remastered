import { describe, expect, it } from 'vitest';
import { computeHitDamage } from '../src/index';
import type { HitDamageInput } from '../src/index';

function input(overrides: Partial<HitDamageInput>): HitDamageInput {
  return {
    diceTotal: 5,
    scalingStat: 35,
    scalingRatioBp: 10_000,
    critical: false,
    damageType: 'physical',
    armor: 60,
    overtimeMultiplier: 1,
    ...overrides,
  };
}

// Expected values computed independently with Python fractions.Fraction, following P-005:
// base, critical x2, Armor, overtime, one round-down, minimum 1.
describe('computeHitDamage (P-005, I-9)', () => {
  it('P-015 fixture: base 1d8 + Attack x 1.0 (5 + 35), Armor 60 -> 25', () => {
    expect(computeHitDamage(input({})).damage).toBe(25);
  });

  it('critical hit doubles the whole base before mitigation -> 50', () => {
    expect(computeHitDamage(input({ critical: true })).damage).toBe(50);
  });

  it('Armor mitigation is exact before the single round-down: 78 x 100 / 115 = 67.83 -> 67', () => {
    expect(computeHitDamage(input({ diceTotal: 8, scalingStat: 70, armor: 15 })).damage).toBe(67);
  });

  it('rounds once at the end: base 41 at Armor 60 -> 25, and its critical -> 51 (not 2 x 25)', () => {
    expect(computeHitDamage(input({ diceTotal: 6 })).damage).toBe(25); // 25.625
    expect(computeHitDamage(input({ diceTotal: 6, critical: true })).damage).toBe(51); // 51.25
  });

  it('overtime multiplies after mitigation: x64 -> 1600', () => {
    expect(computeHitDamage(input({ overtimeMultiplier: 64 })).damage).toBe(1600);
  });

  it('critical and overtime together: (7 + 65) x 2 x 100 / 140 x 2 = 205.7 -> 205', () => {
    expect(
      computeHitDamage(input({ diceTotal: 7, scalingStat: 65, critical: true, armor: 40, overtimeMultiplier: 2 })).damage,
    ).toBe(205);
  });

  it('fractional scaling ratio is exact: 3 + 35 x 0.25 = 11.75 -> 11, critical 23.5 -> 23', () => {
    expect(computeHitDamage(input({ diceTotal: 3, scalingRatioBp: 2_500, armor: 0 })).damage).toBe(11);
    expect(computeHitDamage(input({ diceTotal: 3, scalingRatioBp: 2_500, armor: 0, critical: true })).damage).toBe(23);
  });

  it('negative dice total (e.g. 1d4-8 rolling 3) still deals the minimum 1 on a hit', () => {
    expect(computeHitDamage(input({ diceTotal: -5, scalingStat: 0, scalingRatioBp: 0, armor: 0 })).damage).toBe(1);
  });

  it('negative fractional base floors toward negative infinity before the minimum', () => {
    const result = computeHitDamage(input({ diceTotal: -1, scalingStat: 1, scalingRatioBp: 2_500, armor: 0 }));
    // exact value -0.75: numerator / denominator = -750000 / 1000000
    expect(result.numerator).toBe(-750_000n);
    expect(result.denominator).toBe(1_000_000n);
    expect(result.damage).toBe(1);
  });

  it('negative Armor is treated as 0 (max(0, Armor))', () => {
    expect(computeHitDamage(input({ armor: -20 })).damage).toBe(40);
  });

  it('minimum 1 damage on a hit when mitigation reduces it below 1', () => {
    expect(computeHitDamage(input({ diceTotal: 1, scalingStat: 0, scalingRatioBp: 0, armor: 1000 })).damage).toBe(1);
  });

  it('ratio 0 uses the dice only: 7 x 100 / 110 = 6.36 -> 6', () => {
    expect(computeHitDamage(input({ diceTotal: 7, scalingStat: 90, scalingRatioBp: 0, armor: 10 })).damage).toBe(6);
  });

  it('exposes the exact fraction: fixture case is 40 x 10000 x 100 / (10000 x 160)', () => {
    const result = computeHitDamage(input({}));
    expect(result.numerator).toBe(40_000_000n);
    expect(result.denominator).toBe(1_600_000n);
  });

  it.each([
    ['diceTotal', { diceTotal: 1.5 }],
    ['scalingStat', { scalingStat: Number.NaN }],
    ['scalingRatioBp', { scalingRatioBp: -1 }],
    ['armor', { armor: 0.5 }],
    ['overtimeMultiplier', { overtimeMultiplier: 0 }],
  ] as const)('rejects invalid %s', (_name, overrides) => {
    expect(() => computeHitDamage(input(overrides))).toThrow(RangeError);
  });
});
