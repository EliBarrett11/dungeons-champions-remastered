import { describe, expect, it } from 'vitest';
import {
  EXPEDITION_CONFIG,
  NO_SHOP,
  PROTOTYPE_CONTENT,
  championOf,
  contentProblems,
  economyConfigProblems,
  economyStateProblems,
  reservedRewardChampions,
  transition,
} from '../src/game/index';
import type { ExpeditionState, ShopSlot } from '../src/game/index';
import { act, deepFreeze, newExpedition, placeStandardTeam } from './support/play';

/**
 * M4 economy configuration and state model (checkpoint A), updated in checkpoint C: an
 * Expedition now opens with shop 0 (P-023), so the next shop number after creation is 1.
 */

describe('economy configuration (P-023, P-027)', () => {
  it('holds the owner-approved values and leaves the prototype limits unchanged', () => {
    expect(EXPEDITION_CONFIG.shopSlots).toBe(6);
    expect(EXPEDITION_CONFIG.rerollCost).toBe(2);
    expect(EXPEDITION_CONFIG.maxOwnedChampions).toBe(12);
    expect(EXPEDITION_CONFIG.startingBenchSize).toBe(4);
    expect([EXPEDITION_CONFIG.minTeamSize, EXPEDITION_CONFIG.maxTeamSize]).toEqual([1, 3]);
    expect(economyConfigProblems()).toEqual([]);
  });

  it('is validated by the startup content check, including whether a shop can always be filled', () => {
    expect(contentProblems(PROTOTYPE_CONTENT)).toEqual([]);
    expect(contentProblems(PROTOTYPE_CONTENT, { ...EXPEDITION_CONFIG, rerollCost: -2 })).toEqual([
      'Reroll cost must be a whole number of Gold, 0 or more (got -2).',
    ]);
    // 135 - 12 owned - 6 reserved = 117 can always be offered; a 118-slot shop could not be filled.
    expect(contentProblems(PROTOTYPE_CONTENT, { ...EXPEDITION_CONFIG, shopSlots: 117 })).toEqual([]);
    expect(contentProblems(PROTOTYPE_CONTENT, { ...EXPEDITION_CONFIG, shopSlots: 118 })).toEqual([
      'Only 117 Champions could be offered with a full collection; the shop has 118 slots.',
    ]);
  });

  it('rejects unusable values', () => {
    const base = EXPEDITION_CONFIG;
    expect(economyConfigProblems({ ...base, shopSlots: 0 })).toEqual(['Shop slots must be a whole number of at least 1 (got 0).']);
    expect(economyConfigProblems({ ...base, shopSlots: 2.5 })).toEqual(['Shop slots must be a whole number of at least 1 (got 2.5).']);
    expect(economyConfigProblems({ ...base, rerollCost: -1 })).toEqual(['Reroll cost must be a whole number of Gold, 0 or more (got -1).']);
    expect(economyConfigProblems({ ...base, startingGold: Number.NaN })).toEqual(['Starting Gold must be a whole number, 0 or more (got NaN).']);
    expect(economyConfigProblems({ ...base, maxOwnedChampions: 0 })).toEqual(['The owned-Champion cap must be a whole number of at least 1 (got 0).']);
    expect(economyConfigProblems({ ...base, maxOwnedChampions: 3 })).toEqual([
      'The owned-Champion cap (3) is below the starting collection (4).',
    ]);
    expect(economyConfigProblems({ ...base, maxOwnedChampions: 4, maxTeamSize: 5 })).toEqual([
      'The owned-Champion cap (4) is below the fielding limit (5).',
    ]);
  });
});

describe('Expedition economy state', () => {
  it('starts with shop 0 (six offers) and next shop number 1 for every seed', () => {
    for (const seed of [0, 1, 24, 26, 4294967295]) {
      const state = newExpedition(seed);
      expect(state.shop.number).toBe(0);
      expect(state.shop.slots).toHaveLength(6);
      expect(state.nextShopNumber).toBe(1);
      expect(economyStateProblems(state, PROTOTYPE_CONTENT)).toEqual([]);
    }
  });

  it('a new Expedition resets the shop fields, whatever the previous Expedition held', () => {
    let state = act(act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' }), { type: 'finishBattle' });
    state = act(state, { type: 'chooseReward', bundleId: 'e1-gold' });
    state = act(state, { type: 'endExpedition' });
    const dirty: ExpeditionState = { ...state, nextShopNumber: 7, shop: { number: 6, slots: [{ championId: 'DC-002', price: 2, priceStatus: 'provisional', sold: true }] } };
    const restarted = act(dirty, { type: 'newExpedition', seed: 24 });
    expect(restarted.shop).toEqual(newExpedition(24).shop);
    expect(restarted.shop.number).toBe(0);
    expect(restarted.nextShopNumber).toBe(1);
    expect(restarted).toEqual(newExpedition(24));
  });

  it('keeps the economy consistent through a whole Expedition, with one new shop per round', () => {
    let state = placeStandardTeam(newExpedition(24));
    for (const [round, bundle] of ['e1-champion-a', 'e2-gold'].entries()) {
      state = act(act(act(state, { type: 'startBattle' }), { type: 'finishBattle' }), { type: 'chooseReward', bundleId: bundle });
      expect(economyStateProblems(state, PROTOTYPE_CONTENT)).toEqual([]);
      state = act(state, { type: 'continue' });
      expect([state.shop.number, state.nextShopNumber]).toEqual([round + 1, round + 2]);
      expect(economyStateProblems(state, PROTOTYPE_CONTENT)).toEqual([]);
    }
  });

  it('a rejected action leaves the shop fields unchanged (same state object)', () => {
    const state = deepFreeze(newExpedition(24));
    const result = transition(state, { type: 'finishBattle' }, PROTOTYPE_CONTENT);
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
  });
});

describe('reserved reward Champions (P-031)', () => {
  it('are the six drawn reward Champions, for the whole Expedition', () => {
    let state = newExpedition(24);
    const six = state.offers.flat().flatMap((o) => o.champions);
    expect(six).toHaveLength(6);
    expect([...reservedRewardChampions(state)].sort()).toEqual([...six].sort());
    // Still all six after a reward choice passes one up and the round moves on.
    state = act(act(act(placeStandardTeam(state), { type: 'startBattle' }), { type: 'finishBattle' }), { type: 'chooseReward', bundleId: 'e1-champion-a' });
    state = act(state, { type: 'continue' });
    expect([...reservedRewardChampions(state)].sort()).toEqual([...six].sort());
  });
});

describe('economyStateProblems (invariant checker for later checkpoints)', () => {
  // A shop-less copy of a new Expedition, so each case below adds exactly one shop to check.
  const base: ExpeditionState = { ...newExpedition(24), shop: NO_SHOP, nextShopNumber: 0 };
  const owned = base.bench[0]!.championId;
  const reserved = base.offers[0]![0]!.champions[0]!;
  const free = PROTOTYPE_CONTENT.champions.find((c) => !base.bench.some((b) => b.championId === c.id) && !reservedRewardChampions(base).has(c.id))!;
  const slot = (championId: string, price: number, sold = false): ShopSlot => ({ championId, price, priceStatus: 'provisional', sold });
  const priceOf = (id: string) => PROTOTYPE_CONTENT.champions.find((c) => c.id === id)!.proposed.cost_rank;
  const sixFree = PROTOTYPE_CONTENT.champions
    .filter((c) => !base.bench.some((b) => b.championId === c.id) && !reservedRewardChampions(base).has(c.id))
    .slice(0, 6)
    .map((c) => slot(c.id, c.proposed.cost_rank));
  const withShop = (slots: ShopSlot[], number = 0, next = 1): ExpeditionState => ({ ...base, shop: { number, slots }, nextShopNumber: next });

  it('accepts a consistent shop', () => {
    expect(economyStateProblems(withShop(sixFree), PROTOTYPE_CONTENT)).toEqual([]);
  });

  it('flags Gold, capacity and duplicate ownership problems', () => {
    expect(economyStateProblems({ ...base, gold: -1 }, PROTOTYPE_CONTENT)).toEqual([
      'Gold must be a whole number, 0 or more (got -1).',
      'Gold does not reconcile: -1 held, but 3 starting + 0 earned - 0 spent = 3.',
    ]);
    const thirteen = Array.from({ length: 13 }, (_, i) => ({ instanceId: `c${i + 1}`, championId: PROTOTYPE_CONTENT.champions[i]!.id }));
    expect(economyStateProblems({ ...base, bench: thirteen }, PROTOTYPE_CONTENT)).toContain('13 Champions are owned; the cap is 12 (P-027).');
    expect(economyStateProblems({ ...base, bench: [...base.bench, { instanceId: 'c9', championId: owned }] }, PROTOTYPE_CONTENT)).toEqual([
      'A Champion is owned more than once (P-028).',
    ]);
  });

  it('flags shop numbering and slot-count problems', () => {
    expect(economyStateProblems({ ...base, nextShopNumber: -1 }, PROTOTYPE_CONTENT)).toEqual(['The next shop number must be a whole number, 0 or more (got -1).']);
    expect(economyStateProblems(withShop(sixFree, 1, 1), PROTOTYPE_CONTENT)).toEqual(['Shop number 1 must be below the next shop number 1.']);
    expect(economyStateProblems(withShop(sixFree.slice(0, 5)), PROTOTYPE_CONTENT)).toEqual(['The shop has 5 slots; it must have 6 (P-023).']);
    expect(economyStateProblems({ ...base, shop: { number: null, slots: sixFree } }, PROTOTYPE_CONTENT)).toEqual(['The shop has offers but no shop number.']);
  });

  it('flags wrong prices, repeats, unknown, reserved and owned offers', () => {
    const slots = [...sixFree];
    slots[0] = slot(free.id, priceOf(free.id) === 5 ? 1 : priceOf(free.id) + 1);
    slots[1] = slot(sixFree[2]!.championId, sixFree[2]!.price);
    slots[3] = slot('DC-999', 1);
    slots[4] = slot(reserved, priceOf(reserved));
    slots[5] = slot(owned, priceOf(owned));
    expect(economyStateProblems(withShop(slots), PROTOTYPE_CONTENT)).toEqual([
      `Shop slot 1: price ${slots[0]!.price} is not the cost rank ${priceOf(free.id)} (P-024).`,
      `Shop slot 3 repeats ${sixFree[2]!.championId}.`,
      'Shop slot 4 offers unknown Champion "DC-999".',
      `Shop slot 5 offers reserved reward Champion ${reserved} (P-031).`,
      `Shop slot 6 offers owned Champion ${owned} (P-028).`,
    ]);
    // Every price must carry the provisional marker (P-024).
    const unmarked = [...sixFree];
    unmarked[2] = { ...sixFree[2]!, priceStatus: 'final' as unknown as 'provisional' };
    expect(economyStateProblems(withShop(unmarked), PROTOTYPE_CONTENT)).toEqual(['Shop slot 3: prices must be marked provisional (P-024).']);
    // A slot the player just bought is owned and sold: that is consistent.
    const bought = [...sixFree];
    bought[0] = slot(owned, priceOf(owned), true);
    expect(economyStateProblems(withShop(bought), PROTOTYPE_CONTENT)).toEqual([]);
    expect(championOf(base.bench[0]!, PROTOTYPE_CONTENT)!.id).toBe(owned);
  });
});
