import { EXPEDITION_CONFIG } from './config';

/**
 * M4 economy state model (checkpoint A): the Tavern's slots and its shop numbering (P-023, P-029).
 *
 * Shop generation, pricing, purchases and rerolls arrive in later checkpoints. Here the state only
 * records which shop is showing and which number the next generated shop will use:
 * - `ShopState.number` is the shop number k of the offers on display (null before any shop exists);
 * - `ExpeditionState.nextShopNumber` is the k the next successful generation will use. Only a
 *   successful generation advances it; a rejected action never does (P-029).
 */

export interface ShopSlot {
  /** Roster Champion id (DC-001 …). */
  readonly championId: string;
  /** Provisional price in Gold: the Champion's PROPOSED cost rank (P-024). */
  readonly price: number;
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
  readonly [K in 'shopSlots' | 'rerollCost' | 'maxOwnedChampions' | 'startingGold' | 'startingBenchSize' | 'maxTeamSize']: number;
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
