import { describe, expect, it } from 'vitest';
import { BattleRng, Sfc32 } from '../src/index';

// Expected values were produced by an independent C transcription of PractRand pre0.95
// src/RNGs/sfc.cpp (sfc32::raw32 and sfc32::seed(Uint64)), not by this TypeScript code.
const REFERENCE: Record<number, { state: [number, number, number, number]; outputs: number[] }> = {
  0: {
    state: [3287285385, 2371254317, 4048138432, 13],
    outputs: [1363572419, 145230303, 808754475, 4216505632, 947923937, 2491578854, 3964400089, 2091952393],
  },
  1: {
    state: [725930813, 1286218714, 3405868155, 13],
    outputs: [2012149540, 1872316204, 1707632675, 1779833415, 2026416846, 1661539736, 2729060721, 4156309426],
  },
  12345: {
    state: [658686678, 3871441195, 854079202, 13],
    outputs: [235160590, 2967261163, 116171463, 2882324903, 362604721, 4227106926, 1933307004, 1608300071],
  },
  3735928559: {
    state: [3330193561, 4232124326, 3313245657, 13],
    outputs: [3267350604, 3986441180, 1591877757, 2440477387, 3277164100, 4189619804, 3155853482, 3076947388],
  },
  4294967295: {
    state: [3163937632, 3115766180, 1501450466, 13],
    outputs: [1984736529, 3747275468, 1287205723, 2021412065, 2215341480, 276468999, 2997771941, 3671244912],
  },
};

describe('sfc32 against the independent PractRand-derived reference', () => {
  for (const [seedText, expected] of Object.entries(REFERENCE)) {
    const seed = Number(seedText);

    it(`seed ${seed}: state after the 12 warm-up outputs`, () => {
      const [a, b, c, counter] = expected.state;
      expect(new Sfc32(seed).state()).toEqual({ a, b, c, counter });
    });

    it(`seed ${seed}: first eight outputs`, () => {
      const rng = new Sfc32(seed);
      expect(expected.outputs.map(() => rng.nextUint32())).toEqual(expected.outputs);
    });
  }

  it('every output is a uint32', () => {
    const rng = new Sfc32(4294967295);
    for (let i = 0; i < 10_000; i++) {
      const u = rng.nextUint32();
      expect(Number.isInteger(u) && u >= 0 && u <= 0xffff_ffff).toBe(true);
    }
  });
});

describe('determinism', () => {
  it('the same seed reproduces the same sequence', () => {
    const first = new BattleRng(987654321);
    const second = new BattleRng(987654321);
    const a = Array.from({ length: 1_000 }, () => first.nextUint32());
    const b = Array.from({ length: 1_000 }, () => second.nextUint32());
    expect(a).toEqual(b);
  });

  it('different seeds produce different sequences', () => {
    const outputsFor = (seed: number) => {
      const rng = new BattleRng(seed);
      return Array.from({ length: 16 }, () => rng.nextUint32());
    };
    expect(outputsFor(1)).not.toEqual(outputsFor(2));
  });
});

describe('draw counting', () => {
  it('starts at zero after seeding: warm-up outputs are not draws', () => {
    expect(new BattleRng(12345).drawCount).toBe(0);
  });

  it('counts each output consumed', () => {
    const rng = new BattleRng(12345);
    rng.nextUint32();
    rng.nextUint32();
    rng.nextUint32();
    expect(rng.drawCount).toBe(3);
  });

  it('the first draw is the first output after seeding', () => {
    expect(new BattleRng(12345).nextUint32()).toBe(235160590);
  });
});

describe('seed validation', () => {
  it.each([-1, 4294967296, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects %s', (seed) => {
    expect(() => new Sfc32(seed)).toThrow(RangeError);
  });

  it.each([0, 4294967295])('accepts boundary seed %s', (seed) => {
    expect(() => new Sfc32(seed)).not.toThrow();
  });
});
