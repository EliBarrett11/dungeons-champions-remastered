import { M1_CONFIG } from '../config';

function assertBeforeHardStop(timestampMs: number): void {
  if (!Number.isSafeInteger(timestampMs) || timestampMs < 0) {
    throw new RangeError(`timestamp must be a non-negative integer number of ms; received ${timestampMs}`);
  }
  // I-4: nothing at or after the hard stop resolves, so no multiplier exists there.
  if (timestampMs >= M1_CONFIG.hardStopMs) {
    throw new RangeError(`no action resolves at or after the ${M1_CONFIG.hardStopMs} ms hard stop; received ${timestampMs}`);
  }
}

/**
 * I-3: damage multiplier at timestamp t is 1 if t < 30,000, otherwise 2^(1 + floor((t - 30,000) / 5,000)).
 * Before the hard stop the largest value is x64 (55,000 to 59,999 ms).
 */
export function overtimeMultiplier(timestampMs: number): number {
  assertBeforeHardStop(timestampMs);
  if (timestampMs < M1_CONFIG.overtimeStartMs) {
    return 1;
  }
  const steps = Math.floor((timestampMs - M1_CONFIG.overtimeStartMs) / M1_CONFIG.overtimeStepMs);
  return 2 ** (1 + steps);
}

/** The overtime boundaries before the hard stop: 30,000, 35,000, ... 55,000 ms (I-3, I-4). */
export function overtimeBoundariesMs(): number[] {
  const boundaries: number[] = [];
  for (let t = M1_CONFIG.overtimeStartMs; t < M1_CONFIG.hardStopMs; t += M1_CONFIG.overtimeStepMs) {
    boundaries.push(t);
  }
  return boundaries;
}
