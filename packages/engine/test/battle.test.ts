import { describe, expect, it } from 'vitest';
import { InvalidBattleInputError, overtimeMultiplier, runBattle } from '../src/index';
import type { BattleEvent, BattleInput, BattleResult, Rng, UnitInput, UnitStats } from '../src/index';
import { FIXTURE_BASIC_ATTACK, duel } from './fixtures/roles';
import { CyclingRng } from './support/scripted-rng';

// Focused battle tests use custom stat blocks (allowed by P-015) with the P-015 fixture attack (1d8 + Attack).
// With the generator cycle [9, 0], every commitment rolls d20 = 10 (a hit with Accuracy 100 against
// Evasion 0) and d8 = 1, so each hit deals exactly (1 + Attack) x overtime multiplier at Armor 0.
const HIT_CYCLE = [9, 0];

function unit(id: string, slot: number, stats: Partial<UnitStats> = {}): UnitInput {
  return {
    id,
    slot,
    stats: {
      health: 1_000_000, attack: 99, armor: 0, accuracy: 100, evasion: 0, attackSpeedMilli: 1_000, initiativeModifier: 0,
      ...stats,
    },
    basicAttack: FIXTURE_BASIC_ATTACK,
  };
}

function battle(sideA: UnitInput[], sideB: UnitInput[], seed = 1): BattleInput {
  return { seed, participants: [{ id: 'pA', units: sideA }, { id: 'pB', units: sideB }] };
}

/**
 * Runs with a controlled generator. prefix[0] = 0 (even) puts participant 0 ('pA') on side A; one
 * initiative output per unit follows (9 -> natural 10 for all, so nobody skips unless the test says so).
 */
function run(input: BattleInput, prefix?: number[], cycle: number[] = HIT_CYCLE): { result: BattleResult; rng: CyclingRng } {
  const count = input.participants[0].units.length + input.participants[1].units.length;
  let rng: CyclingRng | undefined;
  const result = runBattle(input, {
    createRng: (): Rng => {
      rng = new CyclingRng(prefix ?? [0, ...Array.from({ length: count }, () => 9)], cycle);
      return rng;
    },
  });
  return { result, rng: rng! };
}

const at = (events: readonly BattleEvent[], t: number) => events.filter((e) => e.t === t && !isSetup(e));
const isSetup = (e: BattleEvent) =>
  e.type === 'battleStart' || e.type === 'sidesAssigned' || e.type === 'initiativeRolled' || e.type === 'initiativeResolved';
const ofType = <K extends BattleEvent['type']>(events: readonly BattleEvent[], type: K) =>
  events.filter((e): e is Extract<BattleEvent, { type: K }> => e.type === type);

describe('commitment versus resolution at one timestamp (P-013, P-014, P-006, P-012)', () => {
  it('both attacks commit before either resolves; both resolve; mutual defeat is a draw', () => {
    const { result, rng } = run(battle([unit('a', 0, { health: 50 })], [unit('b', 0, { health: 50 })]));
    expect(at(result.events, 1000)).toEqual([
      { type: 'attackCommitted', t: 1000, attackerId: 'a', targetId: 'b', natural: 10, attackTotal: 110, armorClass: 10, hit: true, critical: false, dice: [1], diceTotal: 1, overtimeMultiplier: 1, damage: 100 },
      { type: 'attackCommitted', t: 1000, attackerId: 'b', targetId: 'a', natural: 10, attackTotal: 110, armorClass: 10, hit: true, critical: false, dice: [1], diceTotal: 1, overtimeMultiplier: 1, damage: 100 },
      { type: 'attackResolved', t: 1000, attackerId: 'a', targetId: 'b', hit: true, damage: 100, healthBefore: 50, healthRemoved: 50, healthAfter: 0, excessDamage: 50 },
      { type: 'unitDefeated', t: 1000, unitId: 'b' },
      // b was defeated after committing; its stored attack still resolves (P-006, P-013).
      { type: 'attackResolved', t: 1000, attackerId: 'b', targetId: 'a', hit: true, damage: 100, healthBefore: 50, healthRemoved: 50, healthAfter: 0, excessDamage: 50 },
      { type: 'unitDefeated', t: 1000, unitId: 'a' },
      { type: 'battleEnd', t: 1000, outcome: { kind: 'draw', reason: 'mutualDefeat' } },
    ]);
    expect(result.outcome).toEqual({ kind: 'draw', reason: 'mutualDefeat' });
    expect(result.endTimeMs).toBe(1000);
    expect(result.units.map((u) => [u.id, u.health, u.defeated])).toEqual([['a', 0, true], ['b', 0, true]]);
    // 1 side draw + 2 initiative + 2 attacks x (d20 + d8). Resolution draws nothing.
    expect(rng.drawCount).toBe(7);
  });

  it('a target defeated earlier at the same timestamp keeps receiving its stored attacks as excess damage', () => {
    const { result } = run(battle([unit('a1', 0), unit('a2', 1)], [unit('b', 0, { health: 100, attack: 0 })]));
    const resolved = ofType(at(result.events, 1000), 'attackResolved');
    expect(resolved.map((r) => [r.attackerId, r.targetId, r.healthBefore, r.healthRemoved, r.healthAfter, r.excessDamage])).toEqual([
      ['a1', 'b', 100, 100, 0, 0],
      ['a2', 'b', 0, 0, 0, 100], // original target kept; all damage is excess (P-012)
      ['b', 'a1', 1_000_000, 1, 999_999, 0], // b's committed attack resolves after b fell
    ]);
    expect(ofType(result.events, 'unitDefeated').map((e) => e.unitId)).toEqual(['b']); // defeated once only
    expect(result.outcome).toEqual({ kind: 'win', winner: 'pA', winnerSide: 'A' });
  });

  it('stored outcomes are frozen at commitment', () => {
    const { result } = run(battle([unit('a', 0, { health: 50 })], [unit('b', 0, { health: 50 })]));
    for (const committed of ofType(result.events, 'attackCommitted')) {
      expect(Object.isFrozen(committed)).toBe(true);
      expect(Object.isFrozen(committed.dice)).toBe(true);
    }
  });
});

describe('random-number order (ruleset section 9.2)', () => {
  it('a miss draws no damage dice: the next attacker gets the very next output', () => {
    // Setup [0, 9, 9]; at t = 1000: a draws 0 (natural 1, miss, no d8); b draws 9 (natural 10) then 0 (d8 = 1).
    const { result } = run(battle([unit('a', 0)], [unit('b', 0)]), [0, 9, 9, 0, 9, 0]);
    const [aCommit, bCommit] = ofType(at(result.events, 1000), 'attackCommitted');
    expect(aCommit).toMatchObject({ attackerId: 'a', natural: 1, hit: false, critical: false, dice: [], diceTotal: null, damage: null });
    expect(bCommit).toMatchObject({ attackerId: 'b', natural: 10, hit: true, dice: [1], diceTotal: 1, damage: 100 });
    const [aResolve] = ofType(at(result.events, 1000), 'attackResolved');
    expect(aResolve).toMatchObject({ attackerId: 'a', hit: false, damage: 0, healthRemoved: 0, excessDamage: 0 });
  });

  it('a skipped first attack logs attackSkipped and draws nothing; the first real attack is two intervals in', () => {
    // a rolls initiative 5 (output 4), b rolls 15 (output 14): a is the lower total and skips (P-008).
    const { result } = run(battle([unit('a', 0)], [unit('b', 0)]), [0, 4, 14]);
    expect(at(result.events, 1000).map((e) => [e.type, 'attackerId' in e ? e.attackerId : 'unitId' in e ? e.unitId : ''])).toEqual([
      ['attackCommitted', 'b'],
      ['attackSkipped', 'a'],
      ['attackResolved', 'b'],
    ]);
    const firstByA = ofType(result.events, 'attackCommitted').find((e) => e.attackerId === 'a');
    expect(firstByA?.t).toBe(2000);
  });
});

describe('targeting, retargeting and defeated attackers (P-003, P-016, I-8)', () => {
  // b-fast shares the 1,000 ms interval, so its timer coincides with later moments (2,000, 3,000 ...)
  // at which it must not commit once defeated (P-016).
  const input = battle(
    [unit('a', 0)],
    [unit('b-fast', 0, { health: 50 }), unit('b-back', 5, { attack: 0 })],
  );
  const { result } = run(input);

  it('targets the frontmost occupied row, lowest slot first', () => {
    expect(ofType(result.events, 'attackCommitted').find((e) => e.attackerId === 'a')?.targetId).toBe('b-fast');
  });

  it('retargets at its next commitment after the target fell at an earlier timestamp', () => {
    const aCommits = ofType(result.events, 'attackCommitted').filter((e) => e.attackerId === 'a');
    expect(aCommits.slice(0, 3).map((e) => [e.t, e.targetId])).toEqual([[1000, 'b-fast'], [2000, 'b-back'], [3000, 'b-back']]);
  });

  it('a defeated attacker commits nothing at later timestamps, but its earlier-committed attack resolves', () => {
    const defeatedAt = ofType(result.events, 'unitDefeated').find((e) => e.unitId === 'b-fast')!.t;
    expect(defeatedAt).toBe(1000);
    const later = result.events.filter((e) => e.t > defeatedAt && ('attackerId' in e || 'unitId' in e));
    expect(later.some((e) => ('attackerId' in e && e.attackerId === 'b-fast') || (e.type === 'attackSkipped' && e.unitId === 'b-fast'))).toBe(false);
    expect(ofType(at(result.events, 1000), 'attackResolved').some((e) => e.attackerId === 'b-fast')).toBe(true);
  });
});

describe('overtime boundaries (I-3) and the scheduler', () => {
  it('a boundary between two attack timers is its own moment, with no draws', () => {
    // Interval 1538 ms: attacks at 29,222 (x1) and 30,760 (x2); the boundary 30,000 falls between.
    const { result } = run(battle([unit('a', 0, { attackSpeedMilli: 650, health: 1_000_000_000 })], [unit('b', 0, { attackSpeedMilli: 650, health: 1_000_000_000 })]));
    expect(at(result.events, 30_000)).toEqual([{ type: 'overtimeStep', t: 30_000, multiplier: 2 }]);
    expect(ofType(at(result.events, 29_222), 'attackCommitted').map((e) => e.overtimeMultiplier)).toEqual([1, 1]);
    expect(ofType(at(result.events, 30_760), 'attackCommitted').map((e) => e.overtimeMultiplier)).toEqual([2, 2]);
    expect(result.events.findIndex((e) => e.t === 30_000)).toBeGreaterThan(result.events.findIndex((e) => e.t === 29_222));
  });

  it('an attack exactly at a boundary: overtimeStep comes first, then commitments with the new multiplier', () => {
    const { result } = run(battle([unit('a', 0, { health: 1_000_000_000 })], [unit('b', 0, { health: 1_000_000_000 })]));
    expect(at(result.events, 30_000).map((e) => e.type)).toEqual(['overtimeStep', 'attackCommitted', 'attackCommitted', 'attackResolved', 'attackResolved']);
    expect(ofType(at(result.events, 29_000), 'attackCommitted').map((e) => e.damage)).toEqual([100, 100]);
    expect(ofType(at(result.events, 30_000), 'attackCommitted').map((e) => [e.overtimeMultiplier, e.damage])).toEqual([[2, 200], [2, 200]]);
    expect(at(result.events, 35_000)[0]).toEqual({ type: 'overtimeStep', t: 35_000, multiplier: 4 });
  });

  it('a battle ending before the next boundary emits no later overtimeStep (ends at 32,000)', () => {
    // a deals 100 per hit at x1 (29 hits to 29,000 = 2,900), then 200 at 30,000, 31,000 and 32,000: 3,500 total.
    const { result } = run(battle([unit('a', 0)], [unit('b', 0, { health: 3_500, attack: 0 })]));
    expect(result.endTimeMs).toBe(32_000);
    expect(result.outcome).toEqual({ kind: 'win', winner: 'pA', winnerSide: 'A' });
    expect(ofType(result.events, 'overtimeStep').map((e) => e.t)).toEqual([30_000]);
    expect(result.events.at(-1)?.type).toBe('battleEnd');
  });

  it('a battle ending before 30,000 ms has no overtimeStep at all', () => {
    const { result } = run(battle([unit('a', 0)], [unit('b', 0, { health: 1_000, attack: 0 })]));
    expect(result.endTimeMs).toBe(10_000);
    expect(ofType(result.events, 'overtimeStep')).toEqual([]);
  });

  it('a battle ending exactly at a boundary logs that boundary first, then the actions, then battleEnd', () => {
    // 2,900 by 29,000; 200 x 5 from 30,000 to 34,000 = 3,900; 400 at 35,000 = 4,300.
    const { result } = run(battle([unit('a', 0)], [unit('b', 0, { health: 4_300, attack: 0 })]));
    expect(result.endTimeMs).toBe(35_000);
    expect(at(result.events, 35_000).map((e) => e.type)).toEqual([
      'overtimeStep', 'attackCommitted', 'attackCommitted', 'attackResolved', 'unitDefeated', 'attackResolved', 'battleEnd',
    ]);
    expect(ofType(result.events, 'overtimeStep').map((e) => e.t)).toEqual([30_000, 35_000]);
  });
});

describe('the 55,000 ms boundary and the 60,000 ms hard stop (I-3, I-4)', () => {
  it('interval 1,000: x64 from 55,000; nothing at 60,000 except the hard-stop battleEnd', () => {
    const { result } = run(battle([unit('a', 0, { health: 1_000_000_000 })], [unit('b', 0, { health: 1_000_000_000 })]));
    expect(at(result.events, 55_000)[0]).toEqual({ type: 'overtimeStep', t: 55_000, multiplier: 64 });
    expect(ofType(at(result.events, 59_000), 'attackCommitted').map((e) => e.overtimeMultiplier)).toEqual([64, 64]);
    expect(at(result.events, 60_000)).toEqual([{ type: 'battleEnd', t: 60_000, outcome: { kind: 'draw', reason: 'hardStop' } }]);
    expect(result.events.some((e) => e.t > 60_000)).toBe(false);
    expect(ofType(result.events, 'overtimeStep').map((e) => [e.t, e.multiplier])).toEqual([
      [30_000, 2], [35_000, 4], [40_000, 8], [45_000, 16], [50_000, 32], [55_000, 64],
    ]);
    expect(result.outcome).toEqual({ kind: 'draw', reason: 'hardStop' });
  });

  it('interval 1 ms: the last attack resolves at 59,999 with x64; nothing at 60,000 but battleEnd', () => {
    const fast = { attackSpeedMilli: 1_000_000, health: 1_000_000_000, attack: 0 };
    const { result } = run(battle([unit('a', 0, fast)], [unit('b', 0, fast)]));
    expect(ofType(at(result.events, 59_999), 'attackCommitted').map((e) => e.overtimeMultiplier)).toEqual([64, 64]);
    expect(at(result.events, 60_000).map((e) => e.type)).toEqual(['battleEnd']);
    expect(ofType(result.events, 'attackCommitted').every((e) => e.t < 60_000)).toBe(true);
  });
});

describe('outcomes', () => {
  it('a win names the surviving side and its participant', () => {
    const { result } = run(battle([unit('a', 0, { attack: 0 })], [unit('b', 0, { health: 1_000_000_000 })]));
    expect(result.outcome).toEqual({ kind: 'draw', reason: 'hardStop' });
    const { result: win } = run(battle([unit('a', 0, { health: 150, attack: 0 })], [unit('b', 0)]));
    expect(win.outcome).toEqual({ kind: 'win', winner: 'pB', winnerSide: 'B' });
    expect(win.events.at(-1)).toEqual({ type: 'battleEnd', t: 2000, outcome: win.outcome });
  });

  it('invalid input is rejected before any generator is created', () => {
    let created = 0;
    expect(() => runBattle({ ...duel(), seed: 2 ** 32 }, { createRng: () => { created += 1; return new CyclingRng([], [0]); } })).toThrow(InvalidBattleInputError);
    expect(created).toBe(0);
  });
});

describe('event-log invariants over many seeded Role-table battles', () => {
  const ROLES = ['tank', 'bruiser', 'assassin', 'skirmisher', 'marksman', 'artillery', 'mage', 'controller', 'support'] as const;
  const STATS: Record<(typeof ROLES)[number], Omit<UnitStats, 'initiativeModifier'>> = {
    tank: { health: 900, attack: 35, armor: 60, accuracy: 1, evasion: 1, attackSpeedMilli: 650 },
    bruiser: { health: 760, attack: 65, armor: 40, accuracy: 2, evasion: 2, attackSpeedMilli: 800 },
    assassin: { health: 520, attack: 75, armor: 15, accuracy: 3, evasion: 5, attackSpeedMilli: 1000 },
    skirmisher: { health: 620, attack: 50, armor: 25, accuracy: 2, evasion: 6, attackSpeedMilli: 1100 },
    marksman: { health: 500, attack: 70, armor: 15, accuracy: 5, evasion: 2, attackSpeedMilli: 1000 },
    artillery: { health: 480, attack: 90, armor: 10, accuracy: 3, evasion: 1, attackSpeedMilli: 650 },
    mage: { health: 500, attack: 25, armor: 10, accuracy: 2, evasion: 2, attackSpeedMilli: 750 },
    controller: { health: 560, attack: 30, armor: 20, accuracy: 3, evasion: 3, attackSpeedMilli: 750 },
    support: { health: 620, attack: 25, armor: 25, accuracy: 2, evasion: 2, attackSpeedMilli: 750 },
  };

  function team(prefix: string, seed: number): UnitInput[] {
    const size = 1 + (seed % 5);
    return Array.from({ length: size }, (_, i) => ({
      id: `${prefix}${i}`,
      slot: (seed + i * 7) % 12, // distinct for i < 12 because 7 and 12 are coprime
      stats: { ...STATS[ROLES[(seed + i * 7) % ROLES.length]!], initiativeModifier: ((seed + i) % 8) - 2 },
      basicAttack: FIXTURE_BASIC_ATTACK,
    }));
  }

  const results = Array.from({ length: 60 }, (_, seed) => {
    const input = battle(team('a', seed), team('b', seed * 3 + 1), seed * 7919);
    return { input, result: runBattle(input) };
  });

  it('every battle validates, ends once, last, at or before 60,000 ms', () => {
    for (const { result } of results) {
      const ends = ofType(result.events, 'battleEnd');
      expect(ends).toHaveLength(1);
      expect(result.events.at(-1)).toBe(ends[0]);
      expect(result.endTimeMs).toBeLessThanOrEqual(60_000);
    }
  });

  it('no overtimeStep occurs after battleEnd', () => {
    for (const { result } of results) {
      const endIndex = result.events.findIndex((e) => e.type === 'battleEnd');
      expect(result.events.slice(endIndex + 1).some((e) => e.type === 'overtimeStep')).toBe(false);
    }
  });

  it('timestamps never decrease; nothing at or after 60,000 except a hard-stop battleEnd', () => {
    for (const { result } of results) {
      for (let i = 1; i < result.events.length; i++) {
        expect(result.events[i]!.t).toBeGreaterThanOrEqual(result.events[i - 1]!.t);
      }
      for (const event of result.events.filter((e) => e.t >= 60_000)) {
        expect(event).toEqual({ type: 'battleEnd', t: 60_000, outcome: { kind: 'draw', reason: 'hardStop' } });
      }
    }
  });

  it('overtimeStep events are exactly the boundaries up to the end time, with the I-3 multiplier', () => {
    for (const { result } of results) {
      const expected = [30_000, 35_000, 40_000, 45_000, 50_000, 55_000].filter((b) => b <= result.endTimeMs);
      expect(ofType(result.events, 'overtimeStep').map((e) => [e.t, e.multiplier])).toEqual(expected.map((b) => [b, overtimeMultiplier(b)]));
    }
  });

  it('Health is never negative; resolution arithmetic and excess are consistent; misses have no dice', () => {
    for (const { result } of results) {
      for (const r of ofType(result.events, 'attackResolved')) {
        expect(r.healthBefore).toBeGreaterThanOrEqual(0);
        expect(r.healthAfter).toBeGreaterThanOrEqual(0);
        expect(r.healthAfter).toBe(r.healthBefore - r.healthRemoved);
        expect(r.excessDamage).toBe(r.damage - r.healthRemoved);
      }
      for (const c of ofType(result.events, 'attackCommitted')) {
        expect(c.overtimeMultiplier).toBe(overtimeMultiplier(c.t));
        if (!c.hit) expect([c.dice, c.diceTotal, c.damage]).toEqual([[], null, null]);
        else expect(c.damage).toBeGreaterThanOrEqual(1);
      }
      for (const u of result.units) expect(u.health).toBeGreaterThanOrEqual(0);
    }
  });

  it('the outcome matches which sides still stand', () => {
    for (const { result } of results) {
      const aStands = result.units.some((u) => u.side === 'A' && !u.defeated);
      const bStands = result.units.some((u) => u.side === 'B' && !u.defeated);
      if (result.outcome.kind === 'win') {
        expect([aStands, bStands]).toEqual(result.outcome.winnerSide === 'A' ? [true, false] : [false, true]);
      } else if (result.outcome.reason === 'mutualDefeat') {
        expect([aStands, bStands]).toEqual([false, false]);
      } else {
        expect([aStands, bStands]).toEqual([true, true]);
        expect(result.endTimeMs).toBe(60_000);
      }
    }
  });

  it('is deterministic: the same input reruns to an identical event log', () => {
    for (const { input, result } of results.slice(0, 10)) {
      expect(JSON.stringify(runBattle(input).events)).toBe(JSON.stringify(result.events));
    }
  });
});
