import { describe, expect, it } from 'vitest';
import { resolveHit } from '../src/index';

describe('resolveHit (P-004, C-012)', () => {
  it('hits when d20 + Accuracy equals AC exactly', () => {
    // AC = 10 + 2 = 12; natural 10 + 2 = 12.
    expect(resolveHit({ natural: 10, accuracy: 2, evasion: 2 })).toEqual({
      natural: 10, attackTotal: 12, armorClass: 12, hit: true, critical: false,
    });
  });

  it('misses when d20 + Accuracy is one below AC', () => {
    expect(resolveHit({ natural: 9, accuracy: 2, evasion: 2 })).toEqual({
      natural: 9, attackTotal: 11, armorClass: 12, hit: false, critical: false,
    });
  });

  it('natural 1 always misses, even when the total beats AC', () => {
    const result = resolveHit({ natural: 1, accuracy: 100, evasion: 0 });
    expect(result.attackTotal).toBeGreaterThanOrEqual(result.armorClass);
    expect(result.hit).toBe(false);
    expect(result.critical).toBe(false);
  });

  it('natural 20 always hits and is critical, even when the total is below AC', () => {
    const result = resolveHit({ natural: 20, accuracy: 0, evasion: 100 });
    expect(result.attackTotal).toBeLessThan(result.armorClass);
    expect(result.hit).toBe(true);
    expect(result.critical).toBe(true);
  });

  it('natural 19 is never critical for a standard Champion', () => {
    expect(resolveHit({ natural: 19, accuracy: 5, evasion: 0 })).toMatchObject({ hit: true, critical: false });
  });

  it('negative Accuracy and Evasion are applied as integers', () => {
    expect(resolveHit({ natural: 8, accuracy: -1, evasion: -3 })).toEqual({
      natural: 8, attackTotal: 7, armorClass: 7, hit: true, critical: false,
    });
  });

  it.each([0, 21, 1.5, Number.NaN])('rejects natural roll %s', (natural) => {
    expect(() => resolveHit({ natural, accuracy: 0, evasion: 0 })).toThrow(RangeError);
  });
});
