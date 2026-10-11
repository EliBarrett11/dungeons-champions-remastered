import type { Rng } from './rng';

const UINT32_RANGE = 2 ** 32;

/**
 * Rolls one die with `sides` faces, uniformly, by rejection sampling (ruleset section 9).
 *
 * limit = 2^32 - (2^32 mod sides). Draw u; while u >= limit, draw again. Result = (u mod sides) + 1.
 * Every accepted u maps to a face with exactly equal probability. A die usually consumes one
 * output and occasionally more; a one-sided die (limit = 2^32) always consumes exactly one.
 */
export function rollDie(rng: Rng, sides: number): number {
  if (!Number.isInteger(sides) || sides < 1 || sides > UINT32_RANGE) {
    throw new RangeError(`die sides must be an integer from 1 to ${UINT32_RANGE}; received ${sides}`);
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % sides);
  for (;;) {
    const u = rng.nextUint32();
    if (u < limit) {
      return (u % sides) + 1;
    }
  }
}

/** Rolls `count` dice of `sides` faces, in order, returning each die's result. */
export function rollDice(rng: Rng, count: number, sides: number): number[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`dice count must be a positive integer; received ${count}`);
  }
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(rollDie(rng, sides));
  }
  return results;
}
