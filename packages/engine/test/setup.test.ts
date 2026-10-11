import { describe, expect, it } from 'vitest';
import { InvalidBattleInputError, setupBattle } from '../src/index';
import type { BattleInput, Rng, UnitInput } from '../src/index';
import { duel, roleUnit } from './fixtures/roles';
import { ScriptedRng } from './support/scripted-rng';

/** Generator factory that records each call and serves a fixed script of outputs. */
function scripted(outputs: number[]) {
  const calls: number[] = [];
  let rng: ScriptedRng | undefined;
  return {
    calls,
    get rng(): ScriptedRng {
      if (rng === undefined) throw new Error('generator was never created');
      return rng;
    },
    createRng: (seed: number): Rng => {
      calls.push(seed);
      rng = new ScriptedRng(outputs);
      return rng;
    },
  };
}

function withModifier(unit: UnitInput, initiativeModifier: number): UnitInput {
  return { ...unit, stats: { ...unit.stats, initiativeModifier } };
}

/** d20 output that yields `natural` (no rejection): u = natural - 1. */
const d20 = (natural: number) => natural - 1;

/** Participant 0 lists units out of slot order; participant 1 too. */
function twoByTwo(seed = 7): BattleInput {
  return {
    seed,
    participants: [
      { id: 'p0', units: [roleUnit('p0-mage', 'mage', 7), roleUnit('p0-tank', 'tank', 0)] },
      { id: 'p1', units: [roleUnit('p1-support', 'support', 11), roleUnit('p1-bruiser', 'bruiser', 3)] },
    ],
  };
}

describe('validation happens before any randomness', () => {
  it('an invalid input throws InvalidBattleInputError and never creates a generator', () => {
    const factory = scripted([0, 0, 0]);
    const invalid = { ...duel(), seed: -1 };
    expect(() => setupBattle(invalid, { createRng: factory.createRng })).toThrow(InvalidBattleInputError);
    expect(factory.calls).toEqual([]);
  });

  it('a malformed input is rejected the same way', () => {
    const factory = scripted([]);
    expect(() => setupBattle({ participants: 'none' }, { createRng: factory.createRng })).toThrow(InvalidBattleInputError);
    expect(factory.calls).toEqual([]);
  });

  it('a valid input creates exactly one generator, from the battle seed', () => {
    const factory = scripted([0, d20(5), d20(5)]);
    setupBattle(duel(4242), { createRng: factory.createRng });
    expect(factory.calls).toEqual([4242]);
  });
});

describe('side assignment and exact draw order (I-5, ruleset section 9.2)', () => {
  it('odd first output: participant 1 is side A; rolls go side A then side B, slots ascending', () => {
    // u = 1 (odd); then naturals 1, 2, 3, 4 in draw order.
    const factory = scripted([1, d20(1), d20(2), d20(3), d20(4)]);
    const setup = setupBattle(twoByTwo(), { createRng: factory.createRng });

    expect(setup.sides).toEqual({ A: 'p1', B: 'p0' });
    expect(setup.units.map((u) => [u.id, u.side, u.slot, u.initiativeNatural])).toEqual([
      ['p1-bruiser', 'A', 3, 1],
      ['p1-support', 'A', 11, 2],
      ['p0-tank', 'B', 0, 3],
      ['p0-mage', 'B', 7, 4],
    ]);
    expect(factory.rng.drawCount).toBe(5); // side draw + one d20 per unit, nothing else
  });

  it('even first output: participant 0 is side A', () => {
    const factory = scripted([2, d20(1), d20(2), d20(3), d20(4)]);
    const setup = setupBattle(twoByTwo(), { createRng: factory.createRng });
    expect(setup.sides).toEqual({ A: 'p0', B: 'p1' });
    expect(setup.units.map((u) => u.id)).toEqual(['p0-tank', 'p0-mage', 'p1-bruiser', 'p1-support']);
  });

  it('a rejected d20 output costs an extra draw and goes to the same unit', () => {
    // 4294967280 is at the d20 rejection limit, so the first unit redraws.
    const factory = scripted([0, 4294967280, d20(9), d20(2)]);
    const setup = setupBattle(duel(), { createRng: factory.createRng });
    expect(setup.units.map((u) => u.initiativeNatural)).toEqual([9, 2]);
    expect(factory.rng.drawCount).toBe(4);
  });

  it('matches the independent sfc32 reference for seed 12345 (3 v 3)', () => {
    // Reference outputs for seed 12345: first u = 235160590 (even, so participant 0 is side A);
    // the next six outputs give d20 results 4, 4, 4, 2, 7, 5.
    const input: BattleInput = {
      seed: 12345,
      participants: [
        { id: 'p0', units: [roleUnit('a0', 'tank', 0), roleUnit('a1', 'mage', 7), roleUnit('a2', 'bruiser', 1)] },
        { id: 'p1', units: [roleUnit('b0', 'marksman', 8), roleUnit('b1', 'tank', 2), roleUnit('b2', 'support', 4)] },
      ],
    };
    const setup = setupBattle(input);
    expect(setup.events[1]).toEqual({ type: 'sidesAssigned', t: 0, u: 235160590, sideA: 'p0', sideB: 'p1' });
    expect(setup.units.map((u) => [u.id, u.initiativeNatural])).toEqual([
      ['a0', 4], ['a2', 4], ['a1', 4], ['b1', 2], ['b2', 7], ['b0', 5],
    ]);
    expect(setup.rng.drawCount).toBe(7);
  });
});

describe('initiative totals, ordering and ties (P-008, P-010)', () => {
  it('total = natural + modifier', () => {
    const input = duel();
    const p0 = input.participants[0];
    const p1 = input.participants[1];
    const factory = scripted([0, d20(10), d20(10)]);
    const setup = setupBattle(
      { ...input, participants: [{ ...p0, units: [withModifier(p0.units[0]!, 3)] }, { ...p1, units: [withModifier(p1.units[0]!, -2)] }] },
      { createRng: factory.createRng },
    );
    expect(setup.units.map((u) => u.initiativeTotal)).toEqual([13, 8]);
  });

  it('orders by total, then side A before side B, then slot', () => {
    // Side A = p0 (u even): tank slot 0 -> 12, mage slot 7 -> 15; side B: bruiser slot 3 -> 12, support slot 11 -> 12.
    const factory = scripted([0, d20(12), d20(15), d20(12), d20(12)]);
    const setup = setupBattle(twoByTwo(), { createRng: factory.createRng });
    expect(setup.actionOrder).toEqual(['p0-mage', 'p0-tank', 'p1-bruiser', 'p1-support']);
  });

  it('every unit tied for the highest total is an opening-Ultimate winner, in P-010 order', () => {
    const factory = scripted([0, d20(18), d20(20), d20(20), d20(5)]);
    const setup = setupBattle(twoByTwo(), { createRng: factory.createRng });
    expect(setup.openingUltimateWinners).toEqual(['p0-mage', 'p1-bruiser']);
  });

  it('a single highest total is the only winner', () => {
    const factory = scripted([0, d20(3), d20(4), d20(19), d20(5)]);
    expect(setupBattle(twoByTwo(), { createRng: factory.createRng }).openingUltimateWinners).toEqual(['p1-bruiser']);
  });
});

describe('first-attack skip flags (P-008)', () => {
  it('totals 1, 2, 2, 3: only the unit with 1 skips', () => {
    const factory = scripted([0, d20(1), d20(2), d20(2), d20(3)]);
    const setup = setupBattle(twoByTwo(), { createRng: factory.createRng });
    expect(setup.units.map((u) => [u.id, u.skipsFirstAttack])).toEqual([
      ['p0-tank', true], ['p0-mage', false], ['p1-bruiser', false], ['p1-support', false],
    ]);
  });

  it('totals 1, 1, 2, 3: both units with 1 skip, across sides', () => {
    const factory = scripted([0, d20(1), d20(3), d20(1), d20(2)]);
    const setup = setupBattle(twoByTwo(), { createRng: factory.createRng });
    expect(setup.units.filter((u) => u.skipsFirstAttack).map((u) => u.id)).toEqual(['p0-tank', 'p1-bruiser']);
  });

  it('a 1 v 1 tie: nobody skips', () => {
    const factory = scripted([0, d20(7), d20(7)]);
    expect(setupBattle(duel(), { createRng: factory.createRng }).units.map((u) => u.skipsFirstAttack)).toEqual([false, false]);
  });
});

describe('initial timers (I-2) and unit state', () => {
  it('timers start at one interval; a skipping unit first attacks after two', () => {
    // duel: p0-tank (0.65 attacks/s -> 1538 ms) vs p1-marksman (1.00 -> 1000 ms); tank rolls lower and skips.
    const factory = scripted([0, d20(2), d20(15)]);
    const setup = setupBattle(duel(), { createRng: factory.createRng });
    const [tank, marksman] = setup.units;
    expect(tank).toMatchObject({ id: 'p0-tank', intervalMs: 1538, nextTimerAtMs: 1538, skipsFirstAttack: true, skipPending: true });
    expect(marksman).toMatchObject({ id: 'p1-marksman', intervalMs: 1000, nextTimerAtMs: 1000, skipsFirstAttack: false, skipPending: false });

    const resolved = setup.events.at(-1);
    expect(resolved).toMatchObject({ type: 'initiativeResolved' });
    if (resolved?.type === 'initiativeResolved') {
      expect(resolved.units).toEqual([
        { unitId: 'p1-marksman', total: 15, skipsFirstAttack: false, intervalMs: 1000, firstTimerAtMs: 1000, firstAttackAtMs: 1000 },
        { unitId: 'p0-tank', total: 2, skipsFirstAttack: true, intervalMs: 1538, firstTimerAtMs: 1538, firstAttackAtMs: 3076 },
      ]);
    }
  });

  it('units start at full Health, undefeated, with no target and the parsed fixture attack', () => {
    const setup = setupBattle(duel());
    for (const unit of setup.units) {
      expect(unit.health).toBe(unit.stats.health);
      expect(unit.defeated).toBe(false);
      expect(unit.targetId).toBeNull();
      expect(unit.attack).toEqual({ dice: { count: 1, sides: 8, modifier: 0 }, scalingRatioBp: 10_000, damageType: 'physical' });
    }
  });
});

describe('setup events', () => {
  it('are battleStart, sidesAssigned, one initiativeRolled per unit in roll order, then initiativeResolved, all at t = 0', () => {
    const factory = scripted([1, d20(1), d20(2), d20(3), d20(4)]);
    const setup = setupBattle(twoByTwo(99), { createRng: factory.createRng });
    expect(setup.events.map((e) => e.type)).toEqual([
      'battleStart', 'sidesAssigned', 'initiativeRolled', 'initiativeRolled', 'initiativeRolled', 'initiativeRolled', 'initiativeResolved',
    ]);
    expect(setup.events.every((e) => e.t === 0)).toBe(true);
    expect(setup.events[0]).toEqual({
      type: 'battleStart',
      t: 0,
      logVersion: 1,
      seed: 99,
      participants: [
        { id: 'p0', units: [{ id: 'p0-tank', slot: 0 }, { id: 'p0-mage', slot: 7 }] },
        { id: 'p1', units: [{ id: 'p1-bruiser', slot: 3 }, { id: 'p1-support', slot: 11 }] },
      ],
    });
    expect(setup.events[2]).toEqual({
      type: 'initiativeRolled', t: 0, unitId: 'p1-bruiser', side: 'A', slot: 3, natural: 1, modifier: 0, total: 1,
    });
    const resolved = setup.events[6];
    expect(resolved?.type === 'initiativeResolved' && resolved.order).toEqual(setup.actionOrder);
  });

  it('are deterministic: the same seed and input give identical events and draw counts', () => {
    const first = setupBattle(twoByTwo(2024));
    const second = setupBattle(twoByTwo(2024));
    expect(JSON.stringify(second.events)).toBe(JSON.stringify(first.events));
    expect(second.rng.drawCount).toBe(first.rng.drawCount);
  });

  it('differ across seeds', () => {
    const logs = new Set([1, 2, 3, 4, 5].map((seed) => JSON.stringify(setupBattle(twoByTwo(seed)).events)));
    expect(logs.size).toBeGreaterThan(1);
  });

  it('contain only JSON-safe values (no BigInt, undefined, NaN)', () => {
    const events = setupBattle(twoByTwo(31)).events;
    expect(JSON.parse(JSON.stringify(events))).toEqual(events);
  });

  it('setup consumes exactly one side draw plus one d20 per unit (no rejection at this seed)', () => {
    expect(setupBattle(twoByTwo(2024)).rng.drawCount).toBe(5);
  });
});
