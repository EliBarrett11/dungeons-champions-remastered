/**
 * sfc32 ("Small Fast Chaotic", 32-bit) by Chris Doty-Humphrey, as used by P-009.
 *
 * Reference: PractRand pre0.95, src/RNGs/sfc.cpp,
 *   PractRand::RNGs::Raw::sfc32::raw32()     (shifts BARREL 21, RSHIFT 9, LSHIFT 3)
 *   PractRand::RNGs::Raw::sfc32::seed(Uint64) (a = 0, b = low 32 bits, c = high 32 bits,
 *                                              counter = 1, then 12 outputs discarded)
 *
 * A battle seed is a uint32, so it is the low 32 bits of the 64-bit PractRand seed and
 * c starts at 0. The 12 warm-up outputs belong to construction: they are not draws, and
 * the first nextUint32() call returns the first output after seeding (I-5's `u`).
 */

const UINT32_MAX = 0xffff_ffff;
const WARM_UP_OUTPUTS = 12;
const BARREL_SHIFT = 21;
const RSHIFT = 9;
const LSHIFT = 3;

export interface Sfc32State {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly counter: number;
}

export function isUint32(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= UINT32_MAX;
}

export class Sfc32 {
  private a: number;
  private b: number;
  private c: number;
  private counter: number;

  constructor(seed: number) {
    if (!isUint32(seed)) {
      throw new RangeError(`sfc32 seed must be an integer from 0 to ${UINT32_MAX}; received ${seed}`);
    }
    this.a = 0;
    this.b = seed >>> 0;
    this.c = 0;
    this.counter = 1;
    for (let i = 0; i < WARM_UP_OUTPUTS; i++) {
      this.nextUint32();
    }
  }

  /** Returns the next 32-bit unsigned output. All arithmetic is exact modulo 2^32. */
  nextUint32(): number {
    const tmp = (this.a + this.b + this.counter) >>> 0;
    this.counter = (this.counter + 1) >>> 0;
    this.a = (this.b ^ (this.b >>> RSHIFT)) >>> 0;
    this.b = (this.c + (this.c << LSHIFT)) >>> 0;
    this.c = ((((this.c << BARREL_SHIFT) | (this.c >>> (32 - BARREL_SHIFT))) >>> 0) + tmp) >>> 0;
    return tmp;
  }

  state(): Sfc32State {
    return { a: this.a, b: this.b, c: this.c, counter: this.counter };
  }
}
