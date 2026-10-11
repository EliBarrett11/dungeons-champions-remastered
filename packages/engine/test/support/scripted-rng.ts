import type { Rng } from '../../src/rng/rng';

/** Test-only Rng that returns a fixed script of outputs and fails loudly when it runs out. */
export class ScriptedRng implements Rng {
  private index = 0;

  constructor(private readonly outputs: readonly number[]) {}

  nextUint32(): number {
    const value = this.outputs[this.index];
    if (value === undefined) {
      throw new Error(`ScriptedRng exhausted after ${this.index} outputs`);
    }
    this.index += 1;
    return value;
  }

  get drawCount(): number {
    return this.index;
  }
}

/** Test-only Rng: serves `prefix` once, then repeats `cycle` forever. */
export class CyclingRng implements Rng {
  private index = 0;

  constructor(
    private readonly prefix: readonly number[],
    private readonly cycle: readonly number[],
  ) {
    if (cycle.length === 0) throw new Error('CyclingRng needs a non-empty cycle');
  }

  nextUint32(): number {
    const i = this.index;
    this.index += 1;
    return i < this.prefix.length ? this.prefix[i]! : this.cycle[(i - this.prefix.length) % this.cycle.length]!;
  }

  get drawCount(): number {
    return this.index;
  }
}
