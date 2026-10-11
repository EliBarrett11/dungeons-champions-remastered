import { describe, expect, it } from 'vitest';
import { Sfc32 } from '@dc/engine';
import {
  EXPEDITION_CONFIG,
  PROTOTYPE_CONTENT,
  contentProblems,
  encounterSeed,
  parseSeed,
  transition,
} from '../src/game/index';
import type { ExpeditionContent, ExpeditionState } from '../src/game/index';
import { act, deepFreeze, newExpedition, placeStandardTeam } from './support/play';

const fresh = () => deepFreeze(newExpedition(2));

function rejected(state: ExpeditionState, action: Parameters<typeof transition>[1], content: ExpeditionContent = PROTOTYPE_CONTENT) {
  const result = transition(state, action, content);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('unreachable');
  expect(result.state).toBe(state); // unchanged, same object
  return result;
}

describe('createExpedition', () => {
  it('starts in preparation with the starting bench, no board, no Gold and no battle', () => {
    const state = newExpedition(7);
    expect(state).toMatchObject({ seed: 7, phase: 'preparation', encounterIndex: 0, formation: [], gold: 0, battle: null, history: [] });
    expect(state.bench.map((b) => b.instanceId)).toEqual(['c1', 'c2', 'c3', 'c4']);
    for (const b of state.bench) expect(PROTOTYPE_CONTENT.champions.some((c) => c.id === b.championId)).toBe(true);
  });

  it('rejects a seed that is not a uint32', () => {
    expect(() => newExpedition(-1)).toThrow(RangeError);
    expect(() => newExpedition(2 ** 32)).toThrow(RangeError);
  });
});

describe('team preparation', () => {
  it('places, moves and removes Champions', () => {
    let state = act(fresh(), { type: 'place', instanceId: 'c1', slot: 0 });
    expect(state.formation).toEqual([{ instanceId: 'c1', slot: 0 }]);
    state = act(state, { type: 'place', instanceId: 'c1', slot: 9 });
    expect(state.formation).toEqual([{ instanceId: 'c1', slot: 9 }]);
    state = act(state, { type: 'remove', instanceId: 'c1' });
    expect(state.formation).toEqual([]);
  });

  it('rejects an occupied slot, an illegal slot, an unknown Champion and a fourth Champion', () => {
    const state = placeStandardTeam(fresh());
    expect(rejected(state, { type: 'place', instanceId: 'c4', slot: 1 }).error).toBe('Slot 1 is already occupied. Remove that Champion first.');
    expect(rejected(fresh(), { type: 'place', instanceId: 'c1', slot: 12 }).error).toBe('Slot 12 is not a board slot.');
    expect(rejected(fresh(), { type: 'place', instanceId: 'zz', slot: 0 }).error).toBe('Champion zz is not on your bench.');
    expect(rejected(state, { type: 'place', instanceId: 'c4', slot: 2 }).error).toBe('At most 3 Champions can be fielded.');
    expect(rejected(state, { type: 'remove', instanceId: 'c4' }).error).toBe('Champion c4 is not on the board.');
  });

  it('cannot start a battle without a legal team', () => {
    const result = rejected(fresh(), { type: 'startBattle' });
    expect(result.error).toBe('This team cannot start a battle.');
    expect(result.details).toEqual(['Place at least 1 Champion on the board.']);
  });

  it('starts a battle with a legal team and records exactly one battle', () => {
    const state = act(placeStandardTeam(fresh()), { type: 'startBattle' });
    expect(state.phase).toBe('battle');
    expect(state.battlesFought).toBe(1);
    expect(state.battle?.number).toBe(1);
    expect(state.battle?.encounterIndex).toBe(0);
  });

  it('rejects a second start while a battle exists (repeated clicks)', () => {
    const started = act(placeStandardTeam(fresh()), { type: 'startBattle' });
    expect(rejected(started, { type: 'startBattle' }).error).toBe('"startBattle" is not available during the battle phase.');
    expect(started.battlesFought).toBe(1);
  });

  it('does not allow team changes during a battle', () => {
    const started = act(placeStandardTeam(fresh()), { type: 'startBattle' });
    rejected(started, { type: 'remove', instanceId: 'c1' });
    rejected(started, { type: 'place', instanceId: 'c4', slot: 2 });
  });
});

describe('invalid content and engine validation (AC-08)', () => {
  it('reports content problems instead of starting', () => {
    const broken: ExpeditionContent = { ...PROTOTYPE_CONTENT, encounters: PROTOTYPE_CONTENT.encounters.slice(0, 2) };
    const result = rejected(placeStandardTeam(fresh()), { type: 'startBattle' }, broken);
    expect(result.error).toBe('The game data is incomplete, so the battle cannot start.');
    expect(result.details).toEqual(['Expected 3 encounters, found 2.']);
  });

  it('lists every content problem', () => {
    const encounter = PROTOTYPE_CONTENT.encounters[0]!;
    const broken: ExpeditionContent = {
      champions: PROTOTYPE_CONTENT.champions.slice(0, 5),
      encounters: [
        { ...encounter, monsters: [], rewards: [{ id: 'a', gold: -1, championCount: -1 }, { id: 'a', gold: 1, championCount: 0 }] },
        ...PROTOTYPE_CONTENT.encounters.slice(1),
      ],
    };
    expect(contentProblems(broken)).toEqual([
      'The roster has 5 playable Champions; an Expedition draws 8.',
      'Encounter 1 has 0 monsters; the engine allows 1-5.',
      'Encounter 1 offers 2 reward bundles; P-019 requires exactly 3.',
      'Encounter 1: bundle "a" has invalid Gold.',
      'Encounter 1: bundle "a" has an invalid Champion count.',
      'Encounter 1: duplicate reward bundle id "a".',
    ]);
  });

  it('surfaces the engine validation errors when monster stats are invalid', () => {
    const encounter = PROTOTYPE_CONTENT.encounters[0]!;
    const monster = encounter.monsters[0]!;
    const broken: ExpeditionContent = {
      ...PROTOTYPE_CONTENT,
      encounters: [
        { ...encounter, monsters: [{ ...monster, stats: { ...monster.stats, health: 0, attackSpeedMilli: 0 } }] },
        ...PROTOTYPE_CONTENT.encounters.slice(1),
      ],
    };
    const result = rejected(placeStandardTeam(fresh()), { type: 'startBattle' }, broken);
    expect(result.error).toBe('The combat engine rejected this battle.');
    expect(result.details.length).toBe(2);
    expect(result.details.every((d) => d.startsWith('participants[1].units[0].stats.'))).toBe(true);
  });

  it('reports missing Champion data for a bench instance', () => {
    const state: ExpeditionState = { ...placeStandardTeam(fresh()) };
    const missing = state.bench.find((b) => b.instanceId === 'c3')!.championId;
    const broken: ExpeditionContent = { ...PROTOTYPE_CONTENT, champions: PROTOTYPE_CONTENT.champions.filter((c) => c.id !== missing) };
    const result = rejected(state, { type: 'startBattle' }, broken);
    expect(result.error).toBe('The battle could not be prepared.');
    expect(result.details).toEqual(['Champion data for c3 is missing.']);
  });
});

describe('phase guards', () => {
  it('rejects every action outside its phase', () => {
    const prep = fresh();
    for (const action of [
      { type: 'finishBattle' },
      { type: 'chooseReward', bundleId: 'e1-gold' },
      { type: 'continue' },
      { type: 'endExpedition' },
      { type: 'newExpedition', seed: 1 },
    ] as const) {
      expect(rejected(prep, action).error).toBe(`"${action.type}" is not available during the preparation phase.`);
    }
  });
});

describe('encounterSeed (P-009 derivation)', () => {
  it('is the (index + 1)-th sfc32 output of the Expedition seed', () => {
    const generator = new Sfc32(2);
    const outputs = [generator.nextUint32(), generator.nextUint32(), generator.nextUint32()];
    expect([0, 1, 2].map((i) => encounterSeed(2, i))).toEqual(outputs);
  });

  it('differs between encounters and between Expedition seeds', () => {
    expect(new Set([encounterSeed(2, 0), encounterSeed(2, 1), encounterSeed(2, 2), encounterSeed(3, 0)]).size).toBe(4);
  });
});

describe('parseSeed', () => {
  it('accepts decimal uint32 text and rejects anything else', () => {
    expect(parseSeed('0')).toBe(0);
    expect(parseSeed(' 4294967295 ')).toBe(4294967295);
    for (const bad of [null, undefined, '', '-1', '4294967296', '1e3', '12a', '1.5']) expect(parseSeed(bad)).toBeNull();
  });
});

describe('config', () => {
  it('keeps the team limit within the engine limit', () => {
    expect(EXPEDITION_CONFIG.minTeamSize).toBeGreaterThanOrEqual(1);
    expect(EXPEDITION_CONFIG.maxTeamSize).toBeLessThanOrEqual(5);
  });
});
