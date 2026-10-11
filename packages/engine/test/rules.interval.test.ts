import { describe, expect, it } from 'vitest';
import { attackIntervalMs, firstActualAttackAtMs } from '../src/index';

describe('attackIntervalMs (I-2, I-9)', () => {
  // Role-table attack speeds from docs/COMBAT/STAT_MODEL.md, in thousandths.
  it.each([
    [650, 1538], // 1000 / 0.65 = 1538.46
    [750, 1333], // 1333.33
    [800, 1250],
    [1000, 1000],
    [1100, 909], // 909.09
    [2000, 500],
  ])('attack speed %i thousandths -> %i ms', (speed, interval) => {
    expect(attackIntervalMs(speed)).toBe(interval);
  });

  it.each([
    [640, 1563], // 1562.5 rounds half up
    [16_000, 63], // 62.5
    [400_000, 3], // 2.5
  ])('exact halves round up: %i -> %i ms', (speed, interval) => {
    expect(attackIntervalMs(speed)).toBe(interval);
  });

  it.each([
    [1_000_000, 1], // exactly 1 ms
    [3_000_000, 1], // 0.33 ms would round to 0; the interval is never below 1 ms
  ])('never below 1 ms: %i -> %i', (speed, interval) => {
    expect(attackIntervalMs(speed)).toBe(interval);
  });

  it('slowest valid speed: 1 thousandth -> 1,000,000 ms', () => {
    expect(attackIntervalMs(1)).toBe(1_000_000);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects attack speed %s', (speed) => {
    expect(() => attackIntervalMs(speed)).toThrow(RangeError);
  });
});

describe('firstActualAttackAtMs (I-2, P-008)', () => {
  it('a non-skipping Champion first attacks after one interval', () => {
    expect(firstActualAttackAtMs(1538, false)).toBe(1538);
  });

  it('a skipping Champion first attacks after two intervals', () => {
    expect(firstActualAttackAtMs(1538, true)).toBe(3076);
    expect(firstActualAttackAtMs(1, true)).toBe(2);
  });

  it.each([0, -5, 2.5])('rejects interval %s', (interval) => {
    expect(() => firstActualAttackAtMs(interval, false)).toThrow(RangeError);
  });
});
