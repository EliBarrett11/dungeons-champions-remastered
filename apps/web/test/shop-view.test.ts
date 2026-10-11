import { describe, expect, it } from 'vitest';
import {
  EXPEDITION_CONFIG,
  PROTOTYPE_CONTENT,
  buyAvailability,
  priceLabel,
  rerollAvailability,
  rewardAvailability,
  transition,
} from '../src/game/index';
import type { ExpeditionAction, ExpeditionState } from '../src/game/index';
import { act, newExpedition, placeStandardTeam } from './support/play';

/** M4 checkpoint E: the Tavern's button states and labels (shopView.ts). */

function withGold(state: ExpeditionState, gold: number): ExpeditionState {
  return { ...state, gold, goldEarned: gold - EXPEDITION_CONFIG.startingGold + state.goldSpent };
}

const accepted = (state: ExpeditionState, action: ExpeditionAction) => transition(state, action, PROTOTYPE_CONTENT).ok;

describe('labels', () => {
  it('shows the exact price, marked provisional', () => {
    const slots = newExpedition(24).shop.slots;
    expect(slots.map(priceLabel)).toEqual([
      'Price: 1 Gold · provisional', 'Price: 4 Gold · provisional', 'Price: 1 Gold · provisional',
      'Price: 4 Gold · provisional', 'Price: 4 Gold · provisional', 'Price: 4 Gold · provisional',
    ]);
  });

  it('explains every unavailable buy in words (sold, not enough Gold, collection full, wrong phase)', () => {
    const start = newExpedition(24);
    expect(buyAvailability(start, 0)).toEqual({ available: true, label: 'Buy for 1 Gold' });
    expect(buyAvailability(start, 1)).toEqual({ available: false, reason: 'gold', label: 'Need 4 Gold (you have 3)' });
    const bought = act(start, { type: 'buy', slot: 0 });
    expect(buyAvailability(bought, 0)).toEqual({ available: false, reason: 'sold', label: 'Sold' });
    const twelve = Array.from({ length: 12 }, (_, i) => ({ instanceId: `c${i + 1}`, championId: `X-${i}` }));
    expect(buyAvailability({ ...withGold(start, 50), bench: twelve }, 2)).toEqual({ available: false, reason: 'full', label: 'Collection full (12)' });
    const battle = act(placeStandardTeam(start), { type: 'startBattle' });
    expect(buyAvailability(battle, 0)).toEqual({ available: false, reason: 'phase', label: 'Available during preparation' });
    expect(buyAvailability(start, 6).available).toBe(false);
  });

  it('explains an unaffordable or out-of-phase reroll', () => {
    const start = newExpedition(24);
    expect(rerollAvailability(start)).toEqual({ available: true, label: 'Reroll all six (2 Gold)' });
    expect(rerollAvailability(withGold(start, 1))).toEqual({ available: false, reason: 'gold', label: 'Reroll: need 2 Gold (you have 1)' });
    const battle = act(placeStandardTeam(start), { type: 'startBattle' });
    expect(rerollAvailability(battle).available).toBe(false);
  });

  it('disables Champion rewards at 12 owned and keeps the 3-Gold reward (P-030)', () => {
    const reward = act(act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' }), { type: 'finishBattle' });
    const offers = reward.offers[0]!;
    expect(offers.map((o) => rewardAvailability(reward, o).available)).toEqual([true, true, true]);
    const twelve = Array.from({ length: 12 }, (_, i) => ({ instanceId: `c${i + 1}`, championId: `X-${i}` }));
    const full = { ...reward, bench: twelve };
    expect(offers.map((o) => rewardAvailability(full, o))).toEqual([
      { available: false, reason: 'full', label: 'Collection full (12)' },
      { available: false, reason: 'full', label: 'Collection full (12)' },
      { available: true, label: 'Choose this reward' },
    ]);
  });
});

describe('button states agree with the game rules', () => {
  /** Walks seeded Expeditions with purchases and rerolls and compares every button with transition(). */
  it('every buy, reroll and reward button is enabled exactly when the action would be accepted', () => {
    let checked = 0;
    for (let seed = 0; seed < 60; seed += 1) {
      let x = seed + 7;
      const rand = (n: number) => ((x = (x * 1103515245 + 12345) % 2 ** 31), x % n);
      let state = withGold(newExpedition(seed), rand(3) === 0 ? 40 : 3);
      for (let i = 0; i < 60 && state.phase !== 'ended'; i += 1) {
        for (let slot = 0; slot < 6; slot += 1) {
          expect(buyAvailability(state, slot).available).toBe(accepted(state, { type: 'buy', slot }));
          checked += 1;
        }
        expect(rerollAvailability(state).available).toBe(accepted(state, { type: 'reroll' }));
        for (const offer of state.offers[state.encounterIndex] ?? []) {
          expect(rewardAvailability(state, offer).available).toBe(accepted(state, { type: 'chooseReward', bundleId: offer.id }));
        }
        let action: ExpeditionAction;
        if (state.phase === 'preparation') {
          const r = rand(6);
          action = r < 3 ? { type: 'buy', slot: rand(6) } : r === 3 ? { type: 'reroll' } : state.formation.length ? { type: 'startBattle' } : { type: 'place', instanceId: 'c1', slot: 1 };
        } else if (state.phase === 'battle') action = { type: 'finishBattle' };
        else if (state.phase === 'reward') action = { type: 'chooseReward', bundleId: state.offers[state.encounterIndex]![rand(3)]!.id };
        else action = { type: 'continue' };
        state = transition(state, action, PROTOTYPE_CONTENT).state;
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });
});
