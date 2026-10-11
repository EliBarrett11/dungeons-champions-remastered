import { M1_CONFIG } from '../config';

/** P-008 / C-001: initiative total = d20 + Initiative Modifier. */
export function initiativeTotal(natural: number, initiativeModifier: number): number {
  if (!Number.isInteger(natural) || natural < 1 || natural > M1_CONFIG.d20Sides) {
    throw new RangeError(`natural d20 must be an integer from 1 to ${M1_CONFIG.d20Sides}; received ${natural}`);
  }
  if (!Number.isSafeInteger(initiativeModifier)) {
    throw new RangeError(`initiative modifier must be a safe integer; received ${initiativeModifier}`);
  }
  return natural + initiativeModifier;
}

/**
 * P-008: with N Champions in the battle (both sides together) and k = floor(N / 2), a Champion
 * skips its first Basic Attack if and only if the number of Champions whose total is less than
 * or equal to its own is at most k. Ties at the boundary therefore do not skip.
 * Returns one flag per entry of `totals`, in the same order.
 */
export function skipsFirstAttack(totals: readonly number[]): boolean[] {
  const k = Math.floor(totals.length / 2);
  return totals.map((own) => totals.filter((other) => other <= own).length <= k);
}

/**
 * C-001 / C-002: the Champion(s) with the highest initiative total receive the opening bonus
 * Ultimate; every Champion tied for highest receives it. M1 only records the result (P-008).
 * Returns the indices into `totals`, in ascending order.
 */
export function openingUltimateWinners(totals: readonly number[]): number[] {
  if (totals.length === 0) {
    return [];
  }
  const highest = Math.max(...totals);
  return totals.flatMap((total, index) => (total === highest ? [index] : []));
}
