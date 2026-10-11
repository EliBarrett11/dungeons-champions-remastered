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
