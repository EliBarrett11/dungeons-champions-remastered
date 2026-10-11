import { BattleRng, Sfc32, rollDie } from '@dc/engine';
import { EXPEDITION_CONFIG } from './config';

/**
 * M4 Tavern: state model (checkpoint A) and deterministic generation with provisional prices
 * (checkpoint C; P-023, P-024, P-028, P-029, P-031). Purchases and rerolls arrive in checkpoint D.
 *
 * Shop numbering:
 * - `ShopState.number` is the shop number k of the offers on display (null before any shop exists);
 * - `ExpeditionState.nextShopNumber` is the k the next successful generation will use. Only a
 *   successful generation advances it; a rejected action never does (P-029).
 */

export interface ShopSlot {
  /** Roster Champion id (DC-001 …). */
  readonly championId: string;
  /** Price in Gold: the Champion's PROPOSED cost rank, 1–5 (P-024). Not a final balance value. */
  readonly price: number;
  /** P-024: every shop price is provisional. */
  readonly priceStatus: 'provisional';
  /** True once bought; a sold slot stays visible until the next refresh or reroll. */
  readonly sold: boolean;
}

export interface ShopState {
  /** Shop number k of these offers (P-029); null before the first shop is generated. */
  readonly number: number | null;
  readonly slots: readonly ShopSlot[];
}

/** The shop before its first generation. */
export const NO_SHOP: ShopState = Object.freeze({ number: null, slots: Object.freeze([]) });

/** The economy settings that other settings depend on (plain numbers, so tests can vary them). */
export type EconomySettings = {
  readonly [K in 'shopSlots' | 'rerollCost' | 'maxOwnedChampions' | 'startingGold' | 'startingBenchSize' | 'maxTeamSize' | 'encounterCount']: number;
};

const isWhole = (value: number) => Number.isSafeInteger(value);

/** Problems with the economy settings; empty when they are usable. */
export function economyConfigProblems(config: EconomySettings = EXPEDITION_CONFIG): string[] {
  const problems: string[] = [];
  if (!isWhole(config.shopSlots) || config.shopSlots < 1) problems.push(`Shop slots must be a whole number of at least 1 (got ${config.shopSlots}).`);
  if (!isWhole(config.rerollCost) || config.rerollCost < 0) problems.push(`Reroll cost must be a whole number of Gold, 0 or more (got ${config.rerollCost}).`);
  if (!isWhole(config.startingGold) || config.startingGold < 0) problems.push(`Starting Gold must be a whole number, 0 or more (got ${config.startingGold}).`);
  if (!isWhole(config.maxOwnedChampions) || config.maxOwnedChampions < 1) {
    problems.push(`The owned-Champion cap must be a whole number of at least 1 (got ${config.maxOwnedChampions}).`);
  } else {
    if (config.maxOwnedChampions < config.startingBenchSize) {
      problems.push(`The owned-Champion cap (${config.maxOwnedChampions}) is below the starting collection (${config.startingBenchSize}).`);
    }
    if (config.maxOwnedChampions < config.maxTeamSize) {
      problems.push(`The owned-Champion cap (${config.maxOwnedChampions}) is below the fielding limit (${config.maxTeamSize}).`);
    }
  }
  return problems;
}

/**
 * P-029 shop random stream. The Expedition seed's sfc32 outputs are already used as follows:
 * outputs 1–3 are the battle seeds and output 4 seeds the starting bench and reward draw (P-022).
 * The shop stream's root seed R is output 5 of a fresh Sfc32(expeditionSeed). Every derivation
 * builds its own fresh generator, so nothing here can change the battle seeds or the roster draw.
 */
export const SHOP_ROOT_OUTPUT = 5;

/** Output `n` (1-based) of a fresh sfc32 generator seeded with `seed`. */
function nthOutput(seed: number, n: number): number {
  const generator = new Sfc32(seed);
  let value = 0;
  for (let i = 0; i < n; i += 1) value = generator.nextUint32();
  return value;
}

/** R: the root seed of an Expedition's shop stream (output 5 of Sfc32(expeditionSeed)). */
export function shopRootSeed(expeditionSeed: number): number {
  return nthOutput(expeditionSeed, SHOP_ROOT_OUTPUT);
}

/** The seed of shop number k (0-based): output k + 1 of a fresh Sfc32(R). */
export function shopSeed(expeditionSeed: number, shopNumber: number): number {
  if (!Number.isSafeInteger(shopNumber) || shopNumber < 0) throw new RangeError(`Shop number must be a whole number, 0 or more; received ${shopNumber}`);
  return nthOutput(shopRootSeed(expeditionSeed), shopNumber + 1);
}

/** A Champion the shop may offer, with its PROPOSED cost rank. */
export interface ShopCandidate {
  readonly id: string;
  readonly costRank: number;
}

/**
 * Generates shop number `shopNumber` (P-023, P-024, P-029). `candidates` must be the eligible
 * Champions in roster order: owned (P-028) and reserved reward Champions (P-031) already removed.
 * Draws `slots` different Champions by a partial Fisher–Yates shuffle with the engine's rollDie,
 * using new BattleRng(shopSeed(expeditionSeed, shopNumber)). Pure and deterministic.
 */
export function generateShop(
  expeditionSeed: number,
  shopNumber: number,
  candidates: readonly ShopCandidate[],
  slots: number = EXPEDITION_CONFIG.shopSlots,
): ShopState {
  if (candidates.length < slots) throw new RangeError(`Only ${candidates.length} Champions are eligible; the shop needs ${slots}.`);
  const pool = [...candidates];
  const rng = new BattleRng(shopSeed(expeditionSeed, shopNumber));
  for (let i = 0; i < slots; i += 1) {
    const j = i + rollDie(rng, pool.length - i) - 1;
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return {
    number: shopNumber,
    slots: pool.slice(0, slots).map((candidate) => ({
      championId: candidate.id,
      price: candidate.costRank,
      priceStatus: 'provisional' as const,
      sold: false,
    })),
  };
}
