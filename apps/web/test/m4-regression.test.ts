import { describe, expect, it } from 'vitest';
import {
  EXPEDITION_CONFIG,
  PROTOTYPE_CONTENT,
  buyAvailability,
  economyStateProblems,
  rewardAvailability,
  transition,
} from '../src/game/index';
import type { ExpeditionAction, ExpeditionState } from '../src/game/index';
import { act, newExpedition, placeStandardTeam } from './support/play';

/**
 * M4 checkpoint F: regression gaps found by the audit.
 * - The 12-Champion reward state reached by real play (no Gold injected).
 * - Atomicity of every rejected action, and shop numbering only on accepted generations.
 * - Restart and replay after purchases and rerolls.
 */

function expectConsistent(state: ExpeditionState): void {
  expect(economyStateProblems(state, PROTOTYPE_CONTENT)).toEqual([]);
  expect(state.gold).toBe(EXPEDITION_CONFIG.startingGold + state.goldEarned - state.goldSpent);
}

/**
 * Seed 79, found by search: the standard team wins all three rounds while the player buys the
 * cheapest affordable offers and takes the 3-Gold reward. Slots bought: Round 1 [1, 2, 3],
 * Round 2 [2, 5], Round 3 [0, 1, 3]. It reaches the Round 3 reward owning exactly 12.
 */
const CAP_SCRIPT: ExpeditionAction[] = [
  { type: 'buy', slot: 1 }, { type: 'buy', slot: 2 }, { type: 'buy', slot: 3 },
  { type: 'startBattle' }, { type: 'finishBattle' }, { type: 'chooseReward', bundleId: 'e1-gold' }, { type: 'continue' },
  { type: 'buy', slot: 2 }, { type: 'buy', slot: 5 },
  { type: 'startBattle' }, { type: 'finishBattle' }, { type: 'chooseReward', bundleId: 'e2-gold' }, { type: 'continue' },
  { type: 'buy', slot: 0 }, { type: 'buy', slot: 1 }, { type: 'buy', slot: 3 },
  { type: 'startBattle' }, { type: 'finishBattle' },
];

function runScript(seed: number, script: ExpeditionAction[]): ExpeditionState[] {
  const states = [placeStandardTeam(newExpedition(seed))];
  for (const action of script) {
    const next = act(states.at(-1)!, action);
    expectConsistent(next);
    states.push(next);
  }
  return states;
}

describe('the 12-Champion cap reached by real play (seed 79, no Gold injected)', () => {
  const states = runScript(79, CAP_SCRIPT);
  const atReward = states.at(-1)!;

  it('reaches the Round 3 reward owning exactly 12, with Gold reconciled from real rewards and purchases', () => {
    expect([atReward.phase, atReward.encounterIndex, atReward.bench.length]).toEqual(['reward', 2, 12]);
    expect(atReward.goldEarned).toBe(6); // two 3-Gold rewards
    expect(atReward.goldSpent).toBe(8); // eight purchases at 1 Gold each
    expect(atReward.shop.slots.filter((s) => s.sold).every((s) => s.price === 1)).toBe(true);
    expect(atReward.gold).toBe(1); // 3 + 6 - 8
    expect(new Set(atReward.bench.map((b) => b.championId)).size).toBe(12);
  });

  it('at 12 owned in preparation, every unsold offer is refused as "Collection full"', () => {
    const fullPrep = states[CAP_SCRIPT.length - 2]!; // after the last purchase, before the battle
    expect([fullPrep.phase, fullPrep.bench.length]).toEqual(['preparation', 12]);
    const unsold = fullPrep.shop.slots.map((s, i) => ({ s, i })).filter(({ s }) => !s.sold);
    expect(unsold.length).toBeGreaterThan(0);
    for (const { i } of unsold) {
      const result = transition(fullPrep, { type: 'buy', slot: i }, PROTOTYPE_CONTENT);
      expect(result.ok).toBe(false);
      expect(result.state).toBe(fullPrep);
      // Refused for the cap, not for Gold: the cap is checked before affordability.
      if (!result.ok) expect(result.error).toBe('Your collection is full (12 Champions).');
      expect(buyAvailability(fullPrep, i)).toMatchObject({ available: false, label: 'Collection full (12)' });
    }
  });

  it('at the reward, both Champion bundles are refused and the 3-Gold bundle is accepted (P-030)', () => {
    for (const bundleId of ['e3-champion-a', 'e3-champion-b']) {
      const result = transition(atReward, { type: 'chooseReward', bundleId }, PROTOTYPE_CONTENT);
      expect(result.ok).toBe(false);
      expect(result.state).toBe(atReward);
    }
    expect(atReward.offers[2]!.map((o) => rewardAvailability(atReward, o).available)).toEqual([false, false, true]);
    const cleared = act(atReward, { type: 'chooseReward', bundleId: 'e3-gold' });
    expect([cleared.phase, cleared.endReason, cleared.gold, cleared.bench.length]).toEqual(['ended', 'cleared', 4, 12]);
    expectConsistent(cleared);
  });
});

describe('restart and replay after purchases and rerolls', () => {
  it('restarting after spending gives exactly a fresh Expedition, and replaying gives identical states', () => {
    const first = runScript(79, CAP_SCRIPT);
    const ended = act(first.at(-1)!, { type: 'chooseReward', bundleId: 'e3-gold' });
    const restarted = act(ended, { type: 'newExpedition', seed: 79 });
    expect(restarted).toEqual(newExpedition(79));
    expect([restarted.gold, restarted.goldEarned, restarted.goldSpent, restarted.bench.length, restarted.nextShopNumber]).toEqual([3, 0, 0, 4, 1]);
    // Replaying the same actions after the restart reproduces every state, shop and battle.
    let state = placeStandardTeam(restarted);
    const replay = [state];
    for (const action of CAP_SCRIPT) replay.push((state = act(state, action)));
    expect(replay).toEqual(first);
  });

  it('a reroll-heavy script also replays identically', () => {
    const script: ExpeditionAction[] = [{ type: 'reroll' }, { type: 'buy', slot: 0 }, { type: 'buy', slot: 4 }, { type: 'reroll' }];
    const run = () => {
      let state: ExpeditionState = newExpedition(1234);
      const out = [state];
      for (const action of script) {
        const result = transition(state, action, PROTOTYPE_CONTENT);
        state = result.state;
        out.push(state);
      }
      return out;
    };
    expect(run()).toEqual(run());
  });
});

describe('atomicity of every rejected action, and shop numbering only on accepted generations', () => {
  it('holds for random actions of every type, valid and invalid, across 80 seeds', () => {
    const generating = new Set(['continue', 'reroll', 'newExpedition']);
    let rejected = 0;
    for (let seed = 0; seed < 80; seed += 1) {
      let x = seed * 7 + 3;
      const rand = (n: number) => ((x = (x * 1103515245 + 12345) % 2 ** 31), x % n);
      let state = newExpedition(seed);
      for (let step = 0; step < 120; step += 1) {
        const choices: ExpeditionAction[] = [
          { type: 'buy', slot: rand(9) - 1 },
          { type: 'reroll' },
          { type: 'place', instanceId: `c${rand(14)}`, slot: rand(14) - 1 },
          { type: 'remove', instanceId: `c${rand(14)}` },
          { type: 'startBattle' },
          { type: 'finishBattle' },
          { type: 'chooseReward', bundleId: `e${rand(4)}-${['gold', 'champion-a', 'champion-b'][rand(3)]}` },
          { type: 'continue' },
          { type: 'endExpedition' },
          { type: 'newExpedition', seed: rand(3) === 0 ? -1 : seed },
        ];
        const action = choices[rand(choices.length)]!;
        const before = JSON.stringify(state);
        const result = transition(state, action, PROTOTYPE_CONTENT);
        if (!result.ok) {
          rejected += 1;
          expect(result.state).toBe(state);
          expect(JSON.stringify(result.state)).toBe(before);
        } else {
          const next = result.state;
          expectConsistent(next);
          if (action.type === 'newExpedition') expect([next.shop.number, next.nextShopNumber]).toEqual([0, 1]);
          else if (generating.has(action.type)) expect(next.nextShopNumber).toBe(state.nextShopNumber + 1);
          else expect([next.shop.number, next.nextShopNumber]).toEqual([state.shop.number, state.nextShopNumber]);
          state = next;
        }
      }
    }
    expect(rejected).toBeGreaterThan(1000);
  });
});
