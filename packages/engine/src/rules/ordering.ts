import type { Side } from '../types';

export interface OrderKey {
  readonly initiativeTotal: number;
  readonly side: Side;
  readonly slot: number;
}

/**
 * P-010: same-timestamp ordering is initiative total (highest first), then side A before side B,
 * then board slot index (ascending). Within one battle no two Champions share a side and slot,
 * so distinct Champions never compare equal. Negative result: `a` comes first.
 */
export function compareActionOrder(a: OrderKey, b: OrderKey): number {
  if (a.initiativeTotal !== b.initiativeTotal) {
    return b.initiativeTotal - a.initiativeTotal;
  }
  if (a.side !== b.side) {
    return a.side === 'A' ? -1 : 1;
  }
  return a.slot - b.slot;
}

/** Returns a new array in P-010 order; the input is not modified. */
export function sortByActionOrder<T extends OrderKey>(items: readonly T[]): T[] {
  return [...items].sort(compareActionOrder);
}
