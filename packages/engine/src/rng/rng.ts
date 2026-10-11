import { Sfc32 } from './sfc32';

/** Source of 32-bit unsigned integers. All engine randomness flows through one per battle (P-009). */
export interface Rng {
  nextUint32(): number;
  /** Number of nextUint32() outputs consumed so far. */
  readonly drawCount: number;
}

/** The battle's random-number generator: seeded sfc32 with a draw counter. */
export class BattleRng implements Rng {
  private readonly source: Sfc32;
  private draws = 0;

  constructor(seed: number) {
    this.source = new Sfc32(seed);
  }

  nextUint32(): number {
    this.draws += 1;
    return this.source.nextUint32();
  }

  get drawCount(): number {
    return this.draws;
  }
}
