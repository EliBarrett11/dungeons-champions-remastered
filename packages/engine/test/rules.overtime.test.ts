import { describe, expect, it } from 'vitest';
import { overtimeBoundariesMs, overtimeMultiplier } from '../src/index';

describe('overtimeMultiplier (I-3)', () => {
  it.each([
    [0, 1],
    [29_999, 1],
    [30_000, 2],
    [34_999, 2],
    [35_000, 4],
    [39_999, 4],
    [40_000, 8],
    [44_999, 8],
    [45_000, 16],
    [50_000, 32],
    [54_999, 32],
    [55_000, 64],
    [59_999, 64],
  ])('t = %i ms -> x%i', (t, multiplier) => {
    expect(overtimeMultiplier(t)).toBe(multiplier);
  });

  it.each([60_000, 60_001, 120_000])('throws at or after the hard stop (I-4): t = %i', (t) => {
    expect(() => overtimeMultiplier(t)).toThrow(RangeError);
  });

  it.each([-1, 1.5, Number.NaN])('rejects invalid timestamp %s', (t) => {
    expect(() => overtimeMultiplier(t)).toThrow(RangeError);
  });

  it('never reaches x128 at any valid timestamp', () => {
    let largest = 0;
    for (let t = 0; t < 60_000; t += 1) {
      largest = Math.max(largest, overtimeMultiplier(t));
    }
    expect(largest).toBe(64);
  });
});

describe('overtimeBoundariesMs', () => {
  it('lists the six boundaries before the hard stop', () => {
    expect(overtimeBoundariesMs()).toEqual([30_000, 35_000, 40_000, 45_000, 50_000, 55_000]);
  });

  it('each boundary is where the multiplier changes', () => {
    for (const boundary of overtimeBoundariesMs()) {
      expect(overtimeMultiplier(boundary)).toBe(2 * overtimeMultiplier(boundary - 1));
    }
  });
});
