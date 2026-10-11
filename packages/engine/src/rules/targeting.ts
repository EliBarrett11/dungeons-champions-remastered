import { M1_CONFIG } from '../config';

/** I-1: row index of a slot, 0 = front (slots 0-2), 1 = middle (3-6), 2 = back (7-11). */
export function rowOfSlot(slot: number): number {
  if (!Number.isInteger(slot) || slot < 0 || slot >= M1_CONFIG.boardSlots) {
    throw new RangeError(`slot must be an integer from 0 to ${M1_CONFIG.boardSlots - 1}; received ${slot}`);
  }
  let row = 0;
  M1_CONFIG.boardRowStartSlots.forEach((start, index) => {
    if (slot >= start) row = index;
  });
  return row;
}

export interface TargetCandidate {
  readonly id: string;
  readonly slot: number;
  readonly defeated: boolean;
}

/**
 * Basic Attack target at commitment (P-003, P-016, I-8):
 * - keep the current target while it is not defeated;
 * - otherwise choose, among non-defeated enemies only (a slot is occupied only by a non-defeated
 *   Champion), the frontmost occupied row and, within it, the lowest slot index;
 * - if no enemy is alive, return null: no attack is committed.
 * Defeat here means defeated at an earlier timestamp: all commitments at a timestamp happen
 * before any resolution, so nothing is defeated during the commitment stage (P-013).
 */
export function selectTarget(currentTargetId: string | null, enemies: readonly TargetCandidate[]): string | null {
  if (currentTargetId !== null) {
    const current = enemies.find((enemy) => enemy.id === currentTargetId);
    if (current !== undefined && !current.defeated) {
      return currentTargetId;
    }
  }
  let best: TargetCandidate | null = null;
  for (const enemy of enemies) {
    if (enemy.defeated) continue;
    if (
      best === null ||
      rowOfSlot(enemy.slot) < rowOfSlot(best.slot) ||
      (rowOfSlot(enemy.slot) === rowOfSlot(best.slot) && enemy.slot < best.slot)
    ) {
      best = enemy;
    }
  }
  return best === null ? null : best.id;
}
