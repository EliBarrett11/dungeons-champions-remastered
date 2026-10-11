import { EXPEDITION_CONFIG } from './config';
import type { ExpeditionState, RewardOffer } from './expedition';
import type { ShopSlot } from './shop';

/**
 * M4 checkpoint E: what the Tavern's buttons may do and how they explain themselves. Pure
 * presentation rules over the game state; the state machine (`transition`) stays the authority and
 * tests check that each `available` flag agrees with whether the action would be accepted.
 * Every unavailable state has a text label, so the UI never relies on colour alone.
 */

export type Availability =
  | { readonly available: true; readonly label: string }
  | { readonly available: false; readonly reason: 'phase' | 'missing' | 'sold' | 'full' | 'gold'; readonly label: string };

const cap = () => EXPEDITION_CONFIG.maxOwnedChampions;

/** "Price: 3 Gold · provisional" (P-024). */
export function priceLabel(slot: ShopSlot): string {
  return `Price: ${slot.price} Gold · ${slot.priceStatus}`;
}

export function buyAvailability(state: ExpeditionState, slotIndex: number): Availability {
  if (state.phase !== 'preparation') return { available: false, reason: 'phase', label: 'Available during preparation' };
  const slot = state.shop.slots[slotIndex];
  if (!slot) return { available: false, reason: 'missing', label: 'No offer' };
  if (slot.sold) return { available: false, reason: 'sold', label: 'Sold' };
  if (state.bench.length >= cap()) return { available: false, reason: 'full', label: `Collection full (${cap()})` };
  if (state.gold < slot.price) return { available: false, reason: 'gold', label: `Need ${slot.price} Gold (you have ${state.gold})` };
  return { available: true, label: `Buy for ${slot.price} Gold` };
}

export function rerollAvailability(state: ExpeditionState): Availability {
  const cost = EXPEDITION_CONFIG.rerollCost;
  if (state.phase !== 'preparation') return { available: false, reason: 'phase', label: 'Available during preparation' };
  if (state.gold < cost) return { available: false, reason: 'gold', label: `Reroll: need ${cost} Gold (you have ${state.gold})` };
  return { available: true, label: `Reroll all six (${cost} Gold)` };
}

/** P-030: Champion bundles are unavailable at the cap; the Gold-only bundle always stays available. */
export function rewardAvailability(state: ExpeditionState, offer: RewardOffer): Availability {
  if (state.phase !== 'reward') return { available: false, reason: 'phase', label: 'Available after a victory' };
  if (offer.champions.length > 0 && state.bench.length + offer.champions.length > cap()) {
    return { available: false, reason: 'full', label: `Collection full (${cap()})` };
  }
  return { available: true, label: 'Choose this reward' };
}
