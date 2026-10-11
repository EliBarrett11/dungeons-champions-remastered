import { M1_CONFIG, rowOfSlot } from '@dc/engine';
import { EXPEDITION_CONFIG } from './config';

/** One fielded Champion: a bench instance placed in a board slot (P-003, I-1). */
export interface Placement {
  readonly instanceId: string;
  readonly slot: number;
}

export type RowName = 'front' | 'middle' | 'back';

const ROW_NAMES: readonly RowName[] = ['front', 'middle', 'back'];

/** Row of a legal slot, using the engine's own I-1 mapping. */
export function rowName(slot: number): RowName {
  return ROW_NAMES[rowOfSlot(slot)]!;
}

/** Board slots grouped by row, front to back (I-1: front 0-2, middle 3-6, back 7-11). */
export function boardRows(): readonly { readonly row: RowName; readonly slots: readonly number[] }[] {
  const starts = M1_CONFIG.boardRowStartSlots;
  return ROW_NAMES.map((row, index) => {
    const start = starts[index]!;
    const end = starts[index + 1] ?? M1_CONFIG.boardSlots;
    return { row, slots: Array.from({ length: end - start }, (_, offset) => start + offset) };
  });
}

export function isLegalSlot(slot: number): boolean {
  return Number.isInteger(slot) && slot >= 0 && slot < M1_CONFIG.boardSlots;
}

/**
 * Problems that prevent this formation from starting a battle; empty when it is legal.
 * `benchIds` are the instance ids the player owns.
 */
export function formationProblems(formation: readonly Placement[], benchIds: readonly string[]): string[] {
  const problems: string[] = [];
  const { minTeamSize, maxTeamSize } = EXPEDITION_CONFIG;
  if (formation.length < minTeamSize) {
    problems.push(`Place at least ${minTeamSize} Champion${minTeamSize === 1 ? '' : 's'} on the board.`);
  }
  if (formation.length > maxTeamSize) {
    problems.push(`At most ${maxTeamSize} Champions can be fielded (you have ${formation.length}).`);
  }
  const owned = new Set(benchIds);
  const seenInstances = new Set<string>();
  const seenSlots = new Set<number>();
  for (const placement of formation) {
    if (!owned.has(placement.instanceId)) {
      problems.push(`Champion ${placement.instanceId} is not on your bench.`);
    }
    if (seenInstances.has(placement.instanceId)) {
      problems.push(`Champion ${placement.instanceId} is placed more than once.`);
    }
    seenInstances.add(placement.instanceId);
    if (!isLegalSlot(placement.slot)) {
      problems.push(`Slot ${placement.slot} is not a board slot (0-${M1_CONFIG.boardSlots - 1}).`);
    } else if (seenSlots.has(placement.slot)) {
      problems.push(`Slot ${placement.slot} holds more than one Champion.`);
    }
    seenSlots.add(placement.slot);
  }
  return problems;
}
