import { describe, expect, it } from 'vitest';
import { serializeEvents } from '@dc/engine';
import {
  EXPEDITION_CONFIG,
  PROTOTYPE_CONTENT,
  economyStateProblems,
  generateShop,
  reservedRewardChampions,
  shopCandidates,
  transition,
} from '../src/game/index';
import type { ExpeditionAction, ExpeditionState } from '../src/game/index';
import { act, deepFreeze, newExpedition, placeStandardTeam } from './support/play';

/** M4 checkpoint D: purchases, rerolls and capacity (P-023, P-024, P-027, P-028, P-030, P-031). */

/** Gives a state `gold` Gold while keeping the account reconciled (as if it had been earned). */
function withGold(state: ExpeditionState, gold: number): ExpeditionState {
  return { ...state, gold, goldEarned: gold - EXPEDITION_CONFIG.startingGold + state.goldSpent };
}

/** Asserts a transition is rejected and leaves the identical state (nothing at all changes). */
function expectRejected(state: ExpeditionState, action: ExpeditionAction, error?: string): void {
  const frozen = deepFreeze(state);
  const snapshot = JSON.stringify(frozen);
  const result = transition(frozen, action, PROTOTYPE_CONTENT);
  expect(result.ok).toBe(false);
  expect(result.state).toBe(frozen);
  expect(JSON.stringify(result.state)).toBe(snapshot);
  if (error !== undefined && !result.ok) expect(result.error).toBe(error);
}

function expectConsistent(state: ExpeditionState): void {
  expect(economyStateProblems(state, PROTOTYPE_CONTENT)).toEqual([]);
  expect(state.gold).toBe(EXPEDITION_CONFIG.startingGold + state.goldEarned - state.goldSpent);
  expect(state.gold).toBeGreaterThanOrEqual(0);
}

/** Buys the cheapest unsold offer (rerolling when everything is sold) until `owned` Champions. */
function buyUntil(state: ExpeditionState, owned: number): ExpeditionState {
  while (state.bench.length < owned) {
    const unsold = state.shop.slots.map((slot, index) => ({ slot, index })).filter(({ slot }) => !slot.sold);
    if (unsold.length === 0) {
      state = act(state, { type: 'reroll' });
      continue;
    }
    const cheapest = unsold.reduce((a, b) => (b.slot.price < a.slot.price ? b : a));
    state = act(state, { type: 'buy', slot: cheapest.index });
    expectConsistent(state);
  }
  return state;
}

describe('purchases', () => {
  it('a purchase deducts the exact provisional price, adds the Champion once and marks the slot sold', () => {
    const before = newExpedition(24);
    // Seed 24, shop 0, slot 0 is DC-022 at 1 Gold (pinned against the reference in shop.test.ts).
    expect(before.shop.slots[0]).toEqual({ championId: 'DC-022', price: 1, priceStatus: 'provisional', sold: false });
    const after = act(before, { type: 'buy', slot: 0 });
    expect([after.gold, after.goldEarned, after.goldSpent]).toEqual([2, 0, 1]);
    expect(after.bench).toEqual([...before.bench, { instanceId: 'c5', championId: 'DC-022' }]);
    expect(after.bench.filter((b) => b.championId === 'DC-022')).toHaveLength(1);
    expect(after.shop.slots[0]).toEqual({ ...before.shop.slots[0]!, sold: true });
    expect(after.shop.slots.slice(1)).toEqual(before.shop.slots.slice(1));
    expect([after.shop.number, after.nextShopNumber]).toEqual([before.shop.number, before.nextShopNumber]);
    expect(after.formation).toEqual(before.formation); // not placed on the board
    expectConsistent(after);
    // The new Champion can be fielded normally.
    expect(act(after, { type: 'place', instanceId: 'c5', slot: 0 }).formation).toEqual([{ instanceId: 'c5', slot: 0 }]);
  });

  it('cannot buy the same slot twice (repeated or double clicks)', () => {
    const bought = act(newExpedition(24), { type: 'buy', slot: 0 });
    expectRejected(bought, { type: 'buy', slot: 0 }, 'That shop offer has already been bought.');
  });

  it('rejects too little Gold, invalid slots, wrong phases and a full collection without changing anything', () => {
    const prep = newExpedition(24);
    // Slot 1 is DC-007 at 4 Gold; the player holds 3.
    expectRejected(prep, { type: 'buy', slot: 1 }, 'You cannot afford this Champion (4 Gold).');
    for (const slot of [-1, 6, 1.5, Number.NaN, 99]) expectRejected(prep, { type: 'buy', slot }, `Shop slot ${slot} does not exist.`);
    const battle = act(placeStandardTeam(prep), { type: 'startBattle' });
    const reward = act(battle, { type: 'finishBattle' });
    const decision = act(reward, { type: 'chooseReward', bundleId: 'e1-gold' });
    const ended = act(decision, { type: 'endExpedition' });
    for (const state of [battle, reward, decision, ended]) {
      expectRejected(state, { type: 'buy', slot: 0 }, `"buy" is not available during the ${state.phase} phase.`);
    }
    const full = buyUntil(withGold(prep, 200), 12);
    expect(full.bench).toHaveLength(12);
    const open = full.shop.slots.findIndex((slot) => !slot.sold);
    const target = open >= 0 ? full : act(full, { type: 'reroll' });
    expectRejected(target, { type: 'buy', slot: target.shop.slots.findIndex((s) => !s.sold) }, 'Your collection is full (12 Champions).');
  });
});

describe('rerolls', () => {
  it('a reroll costs exactly 2 Gold, replaces all six slots and advances the shop number once', () => {
    const before = act(withGold(newExpedition(24), 10), { type: 'buy', slot: 0 }); // a sold slot is replaced too
    const after = act(before, { type: 'reroll' });
    expect(after.gold).toBe(before.gold - 2);
    expect(after.goldSpent).toBe(before.goldSpent + 2);
    expect([after.shop.number, after.nextShopNumber]).toEqual([before.nextShopNumber, before.nextShopNumber + 1]);
    expect(after.shop).toEqual(generateShop(24, before.nextShopNumber, shopCandidates(before, PROTOTYPE_CONTENT)));
    expect(after.shop.slots).toHaveLength(6);
    expect(after.shop.slots.every((slot) => !slot.sold)).toBe(true);
    expect(after.shop.slots).not.toEqual(before.shop.slots);
    expect(after.bench).toEqual(before.bench);
    expectConsistent(after);
  });

  it('rejects a reroll with too little Gold or in the wrong phase, without using a shop number', () => {
    const poor = act(newExpedition(24), { type: 'buy', slot: 0 }); // 2 Gold left: still affordable
    expect(poor.gold).toBe(2);
    const broke = act(poor, { type: 'buy', slot: 2 }); // DC-109 at 1 Gold -> 1 Gold left
    expect(broke.gold).toBe(1);
    expectRejected(broke, { type: 'reroll' }, 'You cannot afford a reroll (2 Gold).');
    const battle = act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' });
    const reward = act(battle, { type: 'finishBattle' });
    const decision = act(reward, { type: 'chooseReward', bundleId: 'e1-gold' });
    for (const state of [battle, reward, decision, act(decision, { type: 'endExpedition' })]) {
      expectRejected(state, { type: 'reroll' }, `"reroll" is not available during the ${state.phase} phase.`);
    }
    // Exactly 2 Gold is enough.
    expect(act(poor, { type: 'reroll' }).gold).toBe(0);
  });
});

describe('shops after purchases and rewards (P-028, P-031)', () => {
  it('rerolled and refreshed shops never offer an owned or reserved Champion', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      let state = buyUntil(withGold(placeStandardTeam(newExpedition(seed)), 40), 8);
      for (let i = 0; i < 3; i += 1) {
        state = act(state, { type: 'reroll' });
        const owned = new Set(state.bench.map((b) => b.championId));
        const reserved = reservedRewardChampions(state);
        for (const slot of state.shop.slots) {
          expect(owned.has(slot.championId)).toBe(false);
          expect(reserved.has(slot.championId)).toBe(false);
        }
        expectConsistent(state);
      }
    }
  });
});

describe('capacity across every acquisition path (P-027, P-030)', () => {
  it('at 12 owned, Champion reward bundles are refused and the 3-Gold bundle is accepted', () => {
    let state = buyUntil(withGold(placeStandardTeam(newExpedition(24)), 60), 12);
    state = act(act(state, { type: 'startBattle' }), { type: 'finishBattle' });
    expect([state.phase, state.bench.length]).toEqual(['reward', 12]);
    const message = 'Your collection is full (12 Champions), so this reward cannot be chosen. The Gold-only reward is still available.';
    expectRejected(state, { type: 'chooseReward', bundleId: 'e1-champion-a' }, message);
    expectRejected(state, { type: 'chooseReward', bundleId: 'e1-champion-b' }, message);
    const claimed = act(state, { type: 'chooseReward', bundleId: 'e1-gold' });
    expect(claimed.gold).toBe(state.gold + 3);
    expect(claimed.bench).toHaveLength(12);
    expectConsistent(claimed);
  });

  it('at 11 owned, a Champion reward is still allowed and fills the collection to 12', () => {
    let state = buyUntil(withGold(placeStandardTeam(newExpedition(24)), 60), 11);
    state = act(act(state, { type: 'startBattle' }), { type: 'finishBattle' });
    const claimed = act(state, { type: 'chooseReward', bundleId: 'e1-champion-a' });
    expect(claimed.bench).toHaveLength(12);
    expectConsistent(claimed);
  });

  it('keeps the starting collection of four and the fielding limit of 1–3', () => {
    const state = buyUntil(withGold(newExpedition(24), 60), 6);
    expect(newExpedition(24).bench).toHaveLength(4);
    let placed = act(state, { type: 'place', instanceId: 'c1', slot: 0 });
    placed = act(placed, { type: 'place', instanceId: 'c5', slot: 1 });
    placed = act(placed, { type: 'place', instanceId: 'c6', slot: 2 });
    expectRejected(placed, { type: 'place', instanceId: 'c2', slot: 3 }, 'At most 3 Champions can be fielded.');
  });
});

describe('Gold reconciliation and determinism under random play', () => {
  /** A deterministic script of mixed valid and invalid actions, driven by a simple LCG. */
  function play(seed: number, steps: number): { state: ExpeditionState; logs: string[] } {
    let x = seed + 1;
    const rand = (n: number) => ((x = (x * 1103515245 + 12345) % 2 ** 31), x % n);
    let state = newExpedition(seed);
    const logs: string[] = [];
    for (let i = 0; i < steps && state.phase !== 'ended'; i += 1) {
      let action: ExpeditionAction;
      if (state.phase === 'preparation') {
        const roll = rand(10);
        if (roll < 4) action = { type: 'buy', slot: rand(8) - 1 }; // includes invalid slots
        else if (roll < 6) action = { type: 'reroll' };
        else if (state.formation.length === 0) action = { type: 'place', instanceId: state.bench[rand(state.bench.length)]!.instanceId, slot: 1 };
        else action = { type: 'startBattle' };
      } else if (state.phase === 'battle') action = rand(4) === 0 ? { type: 'buy', slot: 0 } : { type: 'finishBattle' };
      else if (state.phase === 'reward') action = { type: 'chooseReward', bundleId: state.offers[state.encounterIndex]![rand(3)]!.id };
      else action = rand(5) === 0 ? { type: 'reroll' } : { type: 'continue' };
      const result = transition(state, action, PROTOTYPE_CONTENT);
      if (!result.ok) expect(result.state).toBe(state);
      state = result.state;
      if (state.battle && action.type === 'startBattle') logs.push(serializeEvents(state.battle.result.events));
      expectConsistent(state);
    }
    return { state, logs };
  }

  it('Gold always reconciles and never goes negative (100 seeds of mixed valid and invalid actions)', () => {
    let spentSomewhere = 0;
    for (let seed = 0; seed < 100; seed += 1) spentSomewhere += play(seed, 80).state.goldSpent;
    expect(spentSomewhere).toBeGreaterThan(0);
  });

  it('the same seed and the same actions reproduce identical shops, purchases, battles and final state', () => {
    for (const seed of [0, 1, 24, 26, 4294967295]) {
      const first = play(seed, 80);
      const second = play(seed, 80);
      expect(second.state).toEqual(first.state);
      expect(second.logs).toEqual(first.logs);
    }
  });
});
