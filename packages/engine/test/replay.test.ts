import { describe, expect, it } from 'vitest';
import { BattleRng, rollDie, runBattle, serializeEvents } from '../src/index';
import type { BattleInput, UnitInput } from '../src/index';
import { roleUnit, ROLE_STATS } from './fixtures/roles';
import type { Role } from './fixtures/roles';
import { sha256Hex } from './support/sha256';

const ROLES = Object.keys(ROLE_STATS) as Role[];

/**
 * Seeded random battle generator for acceptance item 4. Test-only: it uses its own generator
 * (seeded from `n`), separate from each battle's seed, to pick team sizes, roles, slots and
 * initiative modifiers from the Role table (P-007), with the P-015 fixture attack.
 */
function randomBattle(n: number): BattleInput {
  const picker = new BattleRng(n);
  const team = (prefix: string): UnitInput[] => {
    const size = rollDie(picker, 5);
    const slots = Array.from({ length: 12 }, (_, i) => i);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = rollDie(picker, i + 1) - 1;
      [slots[i], slots[j]] = [slots[j]!, slots[i]!];
    }
    return Array.from({ length: size }, (_, i) =>
      roleUnit(`${prefix}${i}`, ROLES[rollDie(picker, ROLES.length) - 1]!, slots[i]!, rollDie(picker, 8) - 3),
    );
  };
  return { seed: picker.nextUint32(), participants: [{ id: 'p0', units: team('a') }, { id: 'p1', units: team('b') }] };
}

describe('acceptance 2: the same seed and input give an identical log and hash across 100 runs', () => {
  it('100 repeated runs', () => {
    const input = randomBattle(7);
    const reference = serializeEvents(runBattle(input).events);
    const referenceHash = sha256Hex(reference);
    for (let run = 0; run < 100; run++) {
      const text = serializeEvents(runBattle(input).events);
      expect(text).toBe(reference);
      expect(sha256Hex(text)).toBe(referenceHash);
    }
  });
});

describe('acceptance 3: different seeds give different logs', () => {
  it('ten seeds of the same teams give more than one distinct hash', () => {
    const base = randomBattle(11);
    const hashes = new Set(
      Array.from({ length: 10 }, (_, i) => sha256Hex(serializeEvents(runBattle({ ...base, seed: 1000 + i }).events))),
    );
    expect(hashes.size).toBeGreaterThan(1);
  });
});

describe('acceptance 4: 1,000 seeded random battles', () => {
  const HEALTH_FIELDS = ['healthBefore', 'healthAfter'] as const;

  it('all end as a win or draw by 60,000 ms, and Health is never below 0 in state or log', () => {
    const outcomes = { win: 0, mutualDefeat: 0, hardStop: 0 };
    for (let n = 0; n < 1_000; n++) {
      const result = runBattle(randomBattle(n));
      const end = result.events.at(-1)!;
      expect(end.type).toBe('battleEnd');
      expect(result.endTimeMs).toBeLessThanOrEqual(60_000);
      if (result.outcome.kind === 'win') outcomes.win += 1;
      else outcomes[result.outcome.reason] += 1;

      for (const unit of result.units) expect(unit.health).toBeGreaterThanOrEqual(0);
      for (const event of result.events) {
        if (event.type === 'attackResolved') {
          for (const field of HEALTH_FIELDS) expect(event[field]).toBeGreaterThanOrEqual(0);
          // Damage beyond remaining Health appears only as excessDamage (P-012).
          expect(event.healthRemoved).toBe(Math.min(event.damage, event.healthBefore));
          expect(event.excessDamage).toBe(event.damage - event.healthRemoved);
        }
      }
      const endIndex = result.events.findIndex((e) => e.type === 'battleEnd');
      expect(endIndex).toBe(result.events.length - 1);
    }
    expect(outcomes.win + outcomes.mutualDefeat + outcomes.hardStop).toBe(1_000);
  });
});
