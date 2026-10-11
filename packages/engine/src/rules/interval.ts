import { M1_CONFIG } from '../config';

const MS_PER_SECOND = 1_000;

/**
 * I-2 / I-9: Basic Attack interval in ms = round(1000 / attacks_per_second), halves rounded up,
 * never below 1 ms. Attack speed is an integer `a` in thousandths of an attack per second, so
 * interval = max(1, floor((2 * 1000 * 1000 + a) / (2 * a))) using integers only.
 */
export function attackIntervalMs(attackSpeedMilli: number): number {
  if (!Number.isSafeInteger(attackSpeedMilli) || attackSpeedMilli < 1) {
    throw new RangeError(`attack speed must be a positive integer number of thousandths; received ${attackSpeedMilli}`);
  }
  const scaled = MS_PER_SECOND * M1_CONFIG.attackSpeedDenominator;
  return Math.max(1, Math.floor((2 * scaled + attackSpeedMilli) / (2 * attackSpeedMilli)));
}

/**
 * I-2: the first Basic Attack happens one full interval after battle start. A Champion that skips
 * its first Basic Attack (P-008) waits through that interval without attacking, then waits another
 * full interval, so its first actual attack is at 2 x interval.
 */
export function firstActualAttackAtMs(intervalMs: number, skipsFirstAttack: boolean): number {
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1) {
    throw new RangeError(`interval must be a positive integer number of ms; received ${intervalMs}`);
  }
  return skipsFirstAttack ? 2 * intervalMs : intervalMs;
}
