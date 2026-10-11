import { describe, expect, it } from 'vitest';
import {
  EXPEDITION_CONFIG,
  PROTOTYPE_CONTENT,
  SHOP_ROOT_OUTPUT,
  contentProblems,
  drawRosterChampions,
  economyStateProblems,
  encounterSeed,
  generateShop,
  reservedRewardChampions,
  shopCandidates,
  shopRootSeed,
  shopSeed,
  transition,
} from '../src/game/index';
import type { ExpeditionAction, ExpeditionState } from '../src/game/index';
import { act, deepFreeze, newExpedition, placeStandardTeam } from './support/play';

/** M4 checkpoint C: deterministic six-slot shop and provisional prices (P-023, P-024, P-028, P-029, P-031). */

const costRank = (id: string) => PROTOTYPE_CONTENT.champions.find((c) => c.id === id)!.proposed.cost_rank;

/** Every rule a shop must satisfy, checked directly (not only through economyStateProblems). */
function expectValidShop(state: ExpeditionState): void {
  const { shop } = state;
  expect(shop.slots).toHaveLength(6);
  const ids = shop.slots.map((s) => s.championId);
  expect(new Set(ids).size).toBe(6); // no duplicates within a shop
  const owned = new Set(state.bench.map((b) => b.championId));
  const reserved = reservedRewardChampions(state);
  expect(reserved.size).toBe(6);
  for (const slot of shop.slots) {
    expect(owned.has(slot.championId)).toBe(false); // P-028
    expect(reserved.has(slot.championId)).toBe(false); // P-031
    expect(slot.price).toBe(costRank(slot.championId)); // P-024
    expect(slot.price).toBeGreaterThanOrEqual(1);
    expect(slot.price).toBeLessThanOrEqual(5);
    expect(slot.priceStatus).toBe('provisional');
    expect(slot.sold).toBe(false);
  }
  expect(economyStateProblems(state, PROTOTYPE_CONTENT)).toEqual([]);
}

function playAndChoose(seed: number, bundles: string[]): ExpeditionState[] {
  const states: ExpeditionState[] = [];
  let state = placeStandardTeam(newExpedition(seed));
  states.push(state);
  for (const bundle of bundles) {
    state = act(act(state, { type: 'startBattle' }), { type: 'finishBattle' });
    if (state.phase !== 'reward') break;
    state = act(state, { type: 'chooseReward', bundleId: bundle });
    if (state.phase !== 'decision') break;
    state = act(state, { type: 'continue' });
    states.push(state);
  }
  return states;
}

describe('shop 0 before Round 1 (P-023)', () => {
  it('a new Expedition offers six valid shop offers, for 300 seeds', () => {
    for (let seed = 0; seed < 300; seed += 1) {
      const state = newExpedition(seed);
      expect([state.phase, state.encounterIndex, state.shop.number, state.nextShopNumber]).toEqual(['preparation', 0, 0, 1]);
      expectValidShop(state);
    }
  });
});

describe('refresh when continuing (P-023)', () => {
  it('each new Monster Round gets a fresh six-slot shop with the next shop number', () => {
    const states = playAndChoose(24, ['e1-champion-a', 'e2-champion-b']);
    expect(states.map((s) => [s.encounterIndex, s.shop.number, s.nextShopNumber])).toEqual([[0, 0, 1], [1, 1, 2], [2, 2, 3]]);
    states.forEach(expectValidShop);
    expect(states[1]!.shop.slots).not.toEqual(states[0]!.shop.slots);
    expect(states[2]!.shop.slots).not.toEqual(states[1]!.shop.slots);
  });

  it('a Champion gained as a reward is never offered afterwards', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      const states = playAndChoose(seed, ['e1-champion-a', 'e2-champion-b']);
      for (const state of states) expectValidShop(state);
    }
  });

  it('no shop is generated outside a new Expedition or a continue', () => {
    let state = placeStandardTeam(newExpedition(24));
    const shop0 = state.shop;
    for (const action of [{ type: 'startBattle' }, { type: 'finishBattle' }, { type: 'chooseReward', bundleId: 'e1-gold' }] as ExpeditionAction[]) {
      state = act(state, action);
      expect([state.shop, state.nextShopNumber]).toEqual([shop0, 1]);
    }
    state = act(state, { type: 'endExpedition' });
    expect([state.shop, state.nextShopNumber]).toEqual([shop0, 1]);
  });
});

describe('determinism (P-029)', () => {
  it('the same seed and actions reproduce identical shops', () => {
    for (const seed of [0, 1, 24, 26, 4294967295]) {
      const first = playAndChoose(seed, ['e1-champion-b', 'e2-gold']).map((s) => s.shop);
      const second = playAndChoose(seed, ['e1-champion-b', 'e2-gold']).map((s) => s.shop);
      expect(second).toEqual(first);
    }
  });

  it('different seeds and different shop numbers give different shops', () => {
    const firstShops = new Set(Array.from({ length: 50 }, (_, seed) => JSON.stringify(newExpedition(seed).shop.slots)));
    expect(firstShops.size).toBe(50);
    const state = newExpedition(24);
    const candidates = shopCandidates(state, PROTOTYPE_CONTENT);
    const byNumber = new Set([0, 1, 2, 3, 4, 5].map((k) => JSON.stringify(generateShop(24, k, candidates).slots)));
    expect(byNumber.size).toBe(6);
  });

  it('every eligible Champion can be offered (the generator reaches the whole pool)', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 400; seed += 1) for (const slot of newExpedition(seed).shop.slots) seen.add(slot.championId);
    expect(seen.size).toBe(135);
  });

  it('the derivation matches an independent reference implementation (Python, PractRand sfc32)', () => {
    // root R = output 5 of Sfc32(seed); shop k seed = output k+1 of Sfc32(R); shop 0 drawn from
    // the roster minus the bench and the six reserved reward Champions.
    const reference: Record<number, { root: number; shopSeeds: number[]; shop0: [string, number][] }> = {
      0: { root: 947923937, shopSeeds: [2435149356, 70405849, 2263733065], shop0: [['DC-025', 2], ['DC-082', 1], ['DC-010', 1], ['DC-064', 1], ['DC-121', 2], ['DC-071', 1]] },
      24: { root: 2404058160, shopSeeds: [4031926812, 681596023, 3147273596], shop0: [['DC-022', 1], ['DC-007', 4], ['DC-109', 1], ['DC-108', 4], ['DC-122', 4], ['DC-115', 4]] },
      4294967295: { root: 2215341480, shopSeeds: [932885178, 3916988804, 3668214351], shop0: [['DC-102', 1], ['DC-041', 5], ['DC-072', 1], ['DC-078', 4], ['DC-069', 1], ['DC-061', 2]] },
    };
    expect(SHOP_ROOT_OUTPUT).toBe(5);
    for (const [seedText, expected] of Object.entries(reference)) {
      const seed = Number(seedText);
      expect(shopRootSeed(seed)).toBe(expected.root);
      expect([0, 1, 2].map((k) => shopSeed(seed, k))).toEqual(expected.shopSeeds);
      expect(newExpedition(seed).shop.slots.map((s) => [s.championId, s.price])).toEqual(expected.shop0);
    }
  });
});

describe('shop generation leaves existing draws untouched (P-029)', () => {
  it('battle seeds and the bench/reward draw are independent of the shop stream', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const battleSeeds = [0, 1, 2].map((i) => encounterSeed(seed, i));
      const rosterDrawSeed = encounterSeed(seed, EXPEDITION_CONFIG.encounterCount);
      expect([...battleSeeds, rosterDrawSeed]).not.toContain(shopRootSeed(seed)); // R differs from outputs 1-4
      expect(encounterSeed(seed, SHOP_ROOT_OUTPUT - 1)).toBe(shopRootSeed(seed)); // R is output 5, after outputs 1-4
      const state = newExpedition(seed);
      const drawn = drawRosterChampions(seed, PROTOTYPE_CONTENT);
      expect(state.bench.map((b) => b.championId)).toEqual(drawn.slice(0, 4));
      expect(state.offers.flat().flatMap((o) => o.champions)).toEqual(drawn.slice(4));
    }
  });

  it('the content check refuses a round count that would make the roster draw reach the shop root', () => {
    expect(contentProblems(PROTOTYPE_CONTENT, { ...EXPEDITION_CONFIG, encounterCount: 3 })).toEqual([]);
    expect(contentProblems(PROTOTYPE_CONTENT, { ...EXPEDITION_CONFIG, encounterCount: 4 })).toContain(
      '4 encounters would make the roster draw collide with the shop stream (output 5).',
    );
  });
});

describe('rejected actions never consume a shop number or alter the shop (P-029)', () => {
  it('returns the identical state for rejected actions in every phase', () => {
    const prep = deepFreeze(newExpedition(24));
    const battle = deepFreeze(act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' }));
    const reward = deepFreeze(act(battle, { type: 'finishBattle' }));
    const decision = deepFreeze(act(reward, { type: 'chooseReward', bundleId: 'e1-gold' }));
    const cases: [ExpeditionState, ExpeditionAction][] = [
      [prep, { type: 'continue' }],
      [prep, { type: 'startBattle' }], // no team placed
      [prep, { type: 'place', instanceId: 'c1', slot: 99 }],
      [battle, { type: 'continue' }],
      [reward, { type: 'chooseReward', bundleId: 'e2-gold' }],
      [reward, { type: 'continue' }],
      [decision, { type: 'chooseReward', bundleId: 'e1-gold' }],
      [decision, { type: 'newExpedition', seed: 1 }],
    ];
    for (const [state, action] of cases) {
      const result = transition(state, action, PROTOTYPE_CONTENT);
      expect(result.ok).toBe(false);
      expect(result.state).toBe(state);
      expect([result.state.shop, result.state.nextShopNumber]).toEqual([state.shop, state.nextShopNumber]);
    }
  });

  it('a rejected continue followed by an accepted one still uses the next number in order', () => {
    const decision = act(act(act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' }), { type: 'finishBattle' }), { type: 'chooseReward', bundleId: 'e1-gold' });
    expect(transition(decision, { type: 'endExpedition' }, PROTOTYPE_CONTENT).ok).toBe(true);
    const rejected = transition(decision, { type: 'finishBattle' }, PROTOTYPE_CONTENT);
    expect(rejected.ok).toBe(false);
    const next = act(rejected.state, { type: 'continue' });
    expect([next.shop.number, next.nextShopNumber]).toEqual([1, 2]);
  });
});

describe('generateShop', () => {
  it('refuses a pool smaller than the shop', () => {
    const five = PROTOTYPE_CONTENT.champions.slice(0, 5).map((c) => ({ id: c.id, costRank: c.proposed.cost_rank }));
    expect(() => generateShop(1, 0, five)).toThrow('Only 5 Champions are eligible; the shop needs 6.');
    expect(() => shopSeed(1, -1)).toThrow(RangeError);
  });

  it('is a pure function of (seed, shop number, candidates)', () => {
    const candidates = shopCandidates(newExpedition(7), PROTOTYPE_CONTENT);
    expect(generateShop(7, 3, candidates)).toEqual(generateShop(7, 3, candidates));
    expect(generateShop(7, 3, candidates).number).toBe(3);
  });
});
