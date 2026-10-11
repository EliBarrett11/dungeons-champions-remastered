import { describe, expect, it } from 'vitest';
import { runBattle, serializeEvents } from '@dc/engine';
import {
  PROTOTYPE_CONTENT,
  ROLE_STATS,
  buildBattleInput,
  buildBattleView,
  championOf,
  eventCountAt,
  snapshotAfter,
  transition,
} from '../src/game/index';
import type { ExpeditionContent, ExpeditionState } from '../src/game/index';
import { act, deepFreeze, newExpedition, placeStandardTeam } from './support/play';

/**
 * Whole-Expedition integration tests. Seeds were chosen by playing the standard team:
 * seed 24 wins all three Monster Rounds; seed 1 wins Rounds 1 and 2 and is defeated in Round 3;
 * seed 26 ends Round 2 in a draw. (Benches are drawn from the roster by seed, P-022.)
 */

function fight(state: ExpeditionState, content: ExpeditionContent = PROTOTYPE_CONTENT): ExpeditionState {
  return act(act(state, { type: 'startBattle' }, content), { type: 'finishBattle' }, content);
}

describe('battle integration (AC-03, AC-09)', () => {
  it('stores exactly the result the engine produces for the same input', () => {
    const prepared = placeStandardTeam(newExpedition(24));
    const input = buildBattleInput(prepared, PROTOTYPE_CONTENT);
    if (typeof input === 'string') throw new Error(input);
    const started = act(prepared, { type: 'startBattle' });
    expect(started.battle!.input).toEqual(input);
    expect(serializeEvents(started.battle!.result.events)).toBe(serializeEvents(runBattle(input).events));
  });

  it('maps the engine outcome to the player and shows the same result', () => {
    const started = act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' });
    const { result, outcome } = started.battle!;
    expect(result.outcome).toMatchObject({ kind: 'win', winner: 'player' });
    expect(outcome).toBe('victory');
    const view = buildBattleView(started.battle!, started.bench, PROTOTYPE_CONTENT);
    expect(view.outcome).toBe('victory');
    expect(view.lines.at(-1)).toMatchObject({ tone: 'result', text: 'Victory! Your team defeated the monsters.' });
  });

  it('derives displayed Health only from the engine log, matching the final engine state', () => {
    const started = act(placeStandardTeam(newExpedition(1)), { type: 'startBattle' });
    const view = buildBattleView(started.battle!, started.bench, PROTOTYPE_CONTENT);
    const final = snapshotAfter(view, view.events.length);
    for (const unit of started.battle!.result.units) {
      expect(final.get(unit.id)).toEqual({ health: unit.health, defeated: unit.defeated });
    }
    const nameOf = (instanceId: string) => championOf(started.bench.find((b) => b.instanceId === instanceId)!, PROTOTYPE_CONTENT)!.name;
    expect(view.units.map((u) => u.name)).toEqual([nameOf('c2'), nameOf('c1'), nameOf('c3'), 'Monster (Skirmisher stats)']);
  });

  it('playback position never changes the stored result', () => {
    const started = deepFreeze(act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' }));
    const before = serializeEvents(started.battle!.result.events);
    const view = buildBattleView(started.battle!, started.bench, PROTOTYPE_CONTENT);
    for (const t of [0, 1, 5_000, view.endTimeMs - 1, view.endTimeMs, 99_999]) snapshotAfter(view, eventCountAt(view, t));
    expect(eventCountAt(view, 0)).toBeLessThan(view.events.length);
    expect(eventCountAt(view, view.endTimeMs)).toBe(view.events.length);
    expect(serializeEvents(started.battle!.result.events)).toBe(before);
  });

  it('is deterministic: the same seed and choices give identical battles', () => {
    const play = () => {
      let state = fight(placeStandardTeam(newExpedition(24)));
      state = act(state, { type: 'chooseReward', bundleId: 'e1-gold' });
      state = act(state, { type: 'continue' });
      return act(state, { type: 'startBattle' }).battle!.result.events;
    };
    expect(serializeEvents(play())).toBe(serializeEvents(play()));
  });
});

describe('roster Champions in battle (M3)', () => {
  it('fields roster Champions with their mapped stats in the engine input', () => {
    const started = act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' });
    const playerUnits = started.battle!.input.participants[0].units;
    expect(playerUnits).toHaveLength(3);
    for (const unit of playerUnits) {
      const champion = championOf(started.bench.find((b) => b.instanceId === unit.id)!, PROTOTYPE_CONTENT)!;
      expect(champion.id).toMatch(/^DC-\d{3}$/);
      expect(unit.stats).toBe(champion.stats);
      expect(unit.basicAttack).toBe(champion.basicAttack);
    }
  });

  it('seed 26: a real roster battle can end in a draw, which ends the Expedition with no reward', () => {
    let state = act(fight(placeStandardTeam(newExpedition(26))), { type: 'chooseReward', bundleId: 'e1-gold' });
    state = act(state, { type: 'continue' });
    state = act(state, { type: 'startBattle' });
    expect(state.battle!.outcome).toBe('draw');
    state = act(state, { type: 'finishBattle' });
    expect(state).toMatchObject({ phase: 'ended', endReason: 'draw', gold: 6 });
  });
});

describe('rewards and progression (AC-05, AC-06)', () => {
  it('a victory offers the reward; choosing it applies Gold and Champions exactly once', () => {
    let state = fight(placeStandardTeam(deepFreeze(newExpedition(24))));
    expect(state.phase).toBe('reward');
    expect(state.gold).toBe(3);
    state = act(state, { type: 'chooseReward', bundleId: 'e1-champion-a' });
    expect(state.phase).toBe('decision');
    expect(state.gold).toBe(4);
    expect(state.bench.at(-1)).toEqual({ instanceId: 'c5', championId: state.offers[0]![0]!.champions[0] });
    expect(state.bench.at(-1)!.championId).toMatch(/^DC-\d{3}$/);
    expect(state.history).toEqual([{ encounterIndex: 0, outcome: 'victory', rewardId: 'e1-champion-a' }]);
    // A second claim (double click) is rejected and changes nothing.
    const again = transition(state, { type: 'chooseReward', bundleId: 'e1-gold' }, PROTOTYPE_CONTENT);
    expect(again.ok).toBe(false);
    expect(again.state).toBe(state);
  });

  it('rejects a reward that is not offered for this encounter', () => {
    const state = fight(placeStandardTeam(newExpedition(24)));
    const result = transition(state, { type: 'chooseReward', bundleId: 'e2-gold' }, PROTOTYPE_CONTENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Reward "e2-gold" is not offered for this encounter.');
  });

  it('finishing the battle twice is rejected (result applied once)', () => {
    const state = fight(placeStandardTeam(newExpedition(24)));
    expect(transition(state, { type: 'finishBattle' }, PROTOTYPE_CONTENT).ok).toBe(false);
  });

  it('continue moves to the next encounter in preparation, keeping the formation and clearing the battle', () => {
    let state = act(fight(placeStandardTeam(newExpedition(24))), { type: 'chooseReward', bundleId: 'e1-champion-b' });
    state = act(state, { type: 'continue' });
    expect(state).toMatchObject({ phase: 'preparation', encounterIndex: 1, battle: null, gold: 4 });
    expect(state.formation).toHaveLength(3);
    // The new Champion can be fielded after swapping someone out.
    state = act(state, { type: 'remove', instanceId: 'c3' });
    state = act(state, { type: 'place', instanceId: 'c5', slot: 2 });
    expect(act(state, { type: 'startBattle' }).battle!.encounterIndex).toBe(1);
  });

  it('ending the Expedition at the decision keeps the rewards earned and ends as retreated', () => {
    let state = act(fight(placeStandardTeam(newExpedition(24))), { type: 'chooseReward', bundleId: 'e1-gold' });
    state = act(state, { type: 'endExpedition' });
    expect(state).toMatchObject({ phase: 'ended', endReason: 'retreated', gold: 6 });
  });
});

describe('complete Expeditions (AC-07)', () => {
  it('seed 24: wins all three Monster Rounds and ends as cleared after the third reward', () => {
    let state = placeStandardTeam(newExpedition(24));
    for (const bundle of ['e1-gold', 'e2-gold']) {
      state = fight(state);
      state = act(state, { type: 'chooseReward', bundleId: bundle });
      state = act(state, { type: 'continue' });
    }
    state = fight(state);
    expect(state.phase).toBe('reward');
    state = act(state, { type: 'chooseReward', bundleId: 'e3-champion-b' });
    expect(state).toMatchObject({ phase: 'ended', endReason: 'cleared', gold: 10, battlesFought: 3, encounterIndex: 2 });
    expect(state.history.map((h) => h.outcome)).toEqual(['victory', 'victory', 'victory']);
    expect(transition(state, { type: 'continue' }, PROTOTYPE_CONTENT).ok).toBe(false);
  });

  it('seed 1: a defeat ends the Expedition with no reward for that battle', () => {
    let state = placeStandardTeam(newExpedition(1));
    for (const bundle of ['e1-gold', 'e2-gold']) {
      state = act(fight(state), { type: 'chooseReward', bundleId: bundle });
      state = act(state, { type: 'continue' });
    }
    state = act(state, { type: 'startBattle' });
    expect(state.battle!.outcome).toBe('defeat');
    state = act(state, { type: 'finishBattle' });
    expect(state).toMatchObject({ phase: 'ended', endReason: 'defeated', gold: 9 });
    expect(state.history.at(-1)).toEqual({ encounterIndex: 2, outcome: 'defeat', rewardId: null });
    expect(transition(state, { type: 'chooseReward', bundleId: 'e3-gold' }, PROTOTYPE_CONTENT).ok).toBe(false);
  });

  it('a hard-cap draw ends the Expedition as a draw with no reward', () => {
    // Content variant: a monster with 10^9 Health whose attack interval (1,000,000 ms at 0.001
    // attacks/s) exceeds the 60-second cap, so neither side can win before the hard stop.
    const encounter = PROTOTYPE_CONTENT.encounters[0]!;
    const sturdy = { ...ROLE_STATS.tank, attackSpeedMilli: 1, health: 1_000_000_000 };
    const content: ExpeditionContent = {
      ...PROTOTYPE_CONTENT,
      encounters: [{ ...encounter, monsters: [{ ...encounter.monsters[0]!, stats: sturdy }] }, ...PROTOTYPE_CONTENT.encounters.slice(1)],
    };
    let state = act(newExpedition(5, content), { type: 'place', instanceId: 'c4', slot: 0 }, content);
    state = act(state, { type: 'startBattle' }, content);
    expect(state.battle!.result.outcome).toEqual({ kind: 'draw', reason: 'hardStop' });
    expect(state.battle!.outcome).toBe('draw');
    state = act(state, { type: 'finishBattle' }, content);
    expect(state).toMatchObject({ phase: 'ended', endReason: 'draw', gold: 3 });
  });

  it('a new Expedition after the end starts clean: no stale battle, rewards, bench or history', () => {
    let state = act(fight(placeStandardTeam(newExpedition(24))), { type: 'chooseReward', bundleId: 'e1-champion-a' });
    state = act(state, { type: 'endExpedition' });
    const restarted = act(state, { type: 'newExpedition', seed: 24 });
    expect(restarted).toEqual(newExpedition(24));
    expect(restarted).toMatchObject({ gold: 3, battle: null, history: [], formation: [], battlesFought: 0, endReason: null });
    expect(restarted.bench).toHaveLength(4);
    // The same seed replays the same first battle as before.
    const first = act(placeStandardTeam(restarted), { type: 'startBattle' });
    const original = act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' });
    expect(serializeEvents(first.battle!.result.events)).toBe(serializeEvents(original.battle!.result.events));
    expect(first.battle!.number).toBe(1);
  });

  it('rejects a restart with an invalid seed', () => {
    const ended = act(act(fight(placeStandardTeam(newExpedition(24))), { type: 'chooseReward', bundleId: 'e1-gold' }), {
      type: 'endExpedition',
    });
    expect(transition(ended, { type: 'newExpedition', seed: -5 }, PROTOTYPE_CONTENT).ok).toBe(false);
  });
});
