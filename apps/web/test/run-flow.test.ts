import { describe, expect, it } from 'vitest';
import { runBattle, serializeEvents } from '@dc/engine';
import {
  PROTOTYPE_CONTENT,
  ROLE_STATS,
  buildBattleInput,
  buildBattleView,
  createExpedition,
  eventCountAt,
  snapshotAfter,
  transition,
} from '../src/game/index';
import type { ExpeditionContent, ExpeditionState } from '../src/game/index';
import { act, deepFreeze, placeStandardTeam } from './support/play';

/**
 * Whole-Expedition integration tests. Seeds were chosen by playing the standard team:
 * seed 2 wins all three Monster Rounds; seed 1 wins Rounds 1 and 2 and is defeated in Round 3.
 */

function fight(state: ExpeditionState, content: ExpeditionContent = PROTOTYPE_CONTENT): ExpeditionState {
  return act(act(state, { type: 'startBattle' }, content), { type: 'finishBattle' }, content);
}

describe('battle integration (AC-03, AC-09)', () => {
  it('stores exactly the result the engine produces for the same input', () => {
    const prepared = placeStandardTeam(createExpedition(2));
    const input = buildBattleInput(prepared, PROTOTYPE_CONTENT);
    if (typeof input === 'string') throw new Error(input);
    const started = act(prepared, { type: 'startBattle' });
    expect(started.battle!.input).toEqual(input);
    expect(serializeEvents(started.battle!.result.events)).toBe(serializeEvents(runBattle(input).events));
  });

  it('maps the engine outcome to the player and shows the same result', () => {
    const started = act(placeStandardTeam(createExpedition(2)), { type: 'startBattle' });
    const { result, outcome } = started.battle!;
    expect(result.outcome).toMatchObject({ kind: 'win', winner: 'player' });
    expect(outcome).toBe('victory');
    const view = buildBattleView(started.battle!, started.bench, PROTOTYPE_CONTENT);
    expect(view.outcome).toBe('victory');
    expect(view.lines.at(-1)).toMatchObject({ tone: 'result', text: 'Victory! Your team defeated the monsters.' });
  });

  it('derives displayed Health only from the engine log, matching the final engine state', () => {
    const started = act(placeStandardTeam(createExpedition(1)), { type: 'startBattle' });
    const view = buildBattleView(started.battle!, started.bench, PROTOTYPE_CONTENT);
    const final = snapshotAfter(view, view.events.length);
    for (const unit of started.battle!.result.units) {
      expect(final.get(unit.id)).toEqual({ health: unit.health, defeated: unit.defeated });
    }
    expect(view.units.map((u) => u.name)).toEqual(['Bruiser', 'Tank', 'Marksman', 'Monster (Skirmisher stats)']);
  });

  it('playback position never changes the stored result', () => {
    const started = deepFreeze(act(placeStandardTeam(createExpedition(2)), { type: 'startBattle' }));
    const before = serializeEvents(started.battle!.result.events);
    const view = buildBattleView(started.battle!, started.bench, PROTOTYPE_CONTENT);
    for (const t of [0, 1, 5_000, view.endTimeMs - 1, view.endTimeMs, 99_999]) snapshotAfter(view, eventCountAt(view, t));
    expect(eventCountAt(view, 0)).toBeLessThan(view.events.length);
    expect(eventCountAt(view, view.endTimeMs)).toBe(view.events.length);
    expect(serializeEvents(started.battle!.result.events)).toBe(before);
  });

  it('is deterministic: the same seed and choices give identical battles', () => {
    const play = () => {
      let state = fight(placeStandardTeam(createExpedition(2)));
      state = act(state, { type: 'chooseReward', bundleId: 'e1-gold' });
      state = act(state, { type: 'continue' });
      return act(state, { type: 'startBattle' }).battle!.result.events;
    };
    expect(serializeEvents(play())).toBe(serializeEvents(play()));
  });
});

describe('rewards and progression (AC-05, AC-06)', () => {
  it('a victory offers the reward; choosing it applies Gold and Champions exactly once', () => {
    let state = fight(placeStandardTeam(deepFreeze(createExpedition(2))));
    expect(state.phase).toBe('reward');
    expect(state.gold).toBe(0);
    state = act(state, { type: 'chooseReward', bundleId: 'e1-assassin' });
    expect(state.phase).toBe('decision');
    expect(state.gold).toBe(1);
    expect(state.bench.at(-1)).toEqual({ instanceId: 'c5', championId: 'assassin' });
    expect(state.history).toEqual([{ encounterIndex: 0, outcome: 'victory', rewardId: 'e1-assassin' }]);
    // A second claim (double click) is rejected and changes nothing.
    const again = transition(state, { type: 'chooseReward', bundleId: 'e1-gold' }, PROTOTYPE_CONTENT);
    expect(again.ok).toBe(false);
    expect(again.state).toBe(state);
  });

  it('rejects a reward that is not offered for this encounter', () => {
    const state = fight(placeStandardTeam(createExpedition(2)));
    const result = transition(state, { type: 'chooseReward', bundleId: 'e2-gold' }, PROTOTYPE_CONTENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Reward "e2-gold" is not offered for this encounter.');
  });

  it('finishing the battle twice is rejected (result applied once)', () => {
    const state = fight(placeStandardTeam(createExpedition(2)));
    expect(transition(state, { type: 'finishBattle' }, PROTOTYPE_CONTENT).ok).toBe(false);
  });

  it('continue moves to the next encounter in preparation, keeping the formation and clearing the battle', () => {
    let state = act(fight(placeStandardTeam(createExpedition(2))), { type: 'chooseReward', bundleId: 'e1-skirmisher' });
    state = act(state, { type: 'continue' });
    expect(state).toMatchObject({ phase: 'preparation', encounterIndex: 1, battle: null, gold: 1 });
    expect(state.formation).toHaveLength(3);
    // The new Champion can be fielded after swapping someone out.
    state = act(state, { type: 'remove', instanceId: 'c3' });
    state = act(state, { type: 'place', instanceId: 'c5', slot: 2 });
    expect(act(state, { type: 'startBattle' }).battle!.encounterIndex).toBe(1);
  });

  it('ending the Expedition at the decision keeps the rewards earned and ends as retreated', () => {
    let state = act(fight(placeStandardTeam(createExpedition(2))), { type: 'chooseReward', bundleId: 'e1-gold' });
    state = act(state, { type: 'endExpedition' });
    expect(state).toMatchObject({ phase: 'ended', endReason: 'retreated', gold: 3 });
  });
});

describe('complete Expeditions (AC-07)', () => {
  it('seed 2: wins all three Monster Rounds and ends as cleared after the third reward', () => {
    let state = placeStandardTeam(createExpedition(2));
    for (const bundle of ['e1-gold', 'e2-gold']) {
      state = fight(state);
      state = act(state, { type: 'chooseReward', bundleId: bundle });
      state = act(state, { type: 'continue' });
    }
    state = fight(state);
    expect(state.phase).toBe('reward');
    state = act(state, { type: 'chooseReward', bundleId: 'e3-marksman' });
    expect(state).toMatchObject({ phase: 'ended', endReason: 'cleared', gold: 7, battlesFought: 3, encounterIndex: 2 });
    expect(state.history.map((h) => h.outcome)).toEqual(['victory', 'victory', 'victory']);
    expect(transition(state, { type: 'continue' }, PROTOTYPE_CONTENT).ok).toBe(false);
  });

  it('seed 1: a defeat ends the Expedition with no reward for that battle', () => {
    let state = placeStandardTeam(createExpedition(1));
    for (const bundle of ['e1-gold', 'e2-gold']) {
      state = act(fight(state), { type: 'chooseReward', bundleId: bundle });
      state = act(state, { type: 'continue' });
    }
    state = act(state, { type: 'startBattle' });
    expect(state.battle!.outcome).toBe('defeat');
    state = act(state, { type: 'finishBattle' });
    expect(state).toMatchObject({ phase: 'ended', endReason: 'defeated', gold: 6 });
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
    let state = act(createExpedition(5), { type: 'place', instanceId: 'c4', slot: 0 }, content);
    state = act(state, { type: 'startBattle' }, content);
    expect(state.battle!.result.outcome).toEqual({ kind: 'draw', reason: 'hardStop' });
    expect(state.battle!.outcome).toBe('draw');
    state = act(state, { type: 'finishBattle' }, content);
    expect(state).toMatchObject({ phase: 'ended', endReason: 'draw', gold: 0 });
  });

  it('a new Expedition after the end starts clean: no stale battle, rewards, bench or history', () => {
    let state = act(fight(placeStandardTeam(createExpedition(2))), { type: 'chooseReward', bundleId: 'e1-assassin' });
    state = act(state, { type: 'endExpedition' });
    const restarted = act(state, { type: 'newExpedition', seed: 2 });
    expect(restarted).toEqual(createExpedition(2));
    expect(restarted).toMatchObject({ gold: 0, battle: null, history: [], formation: [], battlesFought: 0, endReason: null });
    expect(restarted.bench).toHaveLength(4);
    // The same seed replays the same first battle as before.
    const first = act(placeStandardTeam(restarted), { type: 'startBattle' });
    const original = act(placeStandardTeam(createExpedition(2)), { type: 'startBattle' });
    expect(serializeEvents(first.battle!.result.events)).toBe(serializeEvents(original.battle!.result.events));
    expect(first.battle!.number).toBe(1);
  });

  it('rejects a restart with an invalid seed', () => {
    const ended = act(act(fight(placeStandardTeam(createExpedition(2))), { type: 'chooseReward', bundleId: 'e1-gold' }), {
      type: 'endExpedition',
    });
    expect(transition(ended, { type: 'newExpedition', seed: -5 }, PROTOTYPE_CONTENT).ok).toBe(false);
  });
});
