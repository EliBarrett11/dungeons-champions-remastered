import { M1_CONFIG } from '../config';

export interface HitInput {
  /** The unmodified d20 result, 1 to 20. */
  readonly natural: number;
  readonly accuracy: number;
  readonly evasion: number;
}

export interface HitResult {
  readonly natural: number;
  /** d20 + Accuracy. */
  readonly attackTotal: number;
  /** 10 + Evasion. */
  readonly armorClass: number;
  readonly hit: boolean;
  readonly critical: boolean;
}

/**
 * P-004 and C-012, standard Champions (the only kind in M1):
 * natural 1 always misses; natural 20 always hits and is a critical hit;
 * otherwise the attack hits if d20 + Accuracy >= 10 + Evasion, and is never critical.
 */
export function resolveHit(input: HitInput): HitResult {
  const { natural, accuracy, evasion } = input;
  if (!Number.isInteger(natural) || natural < 1 || natural > M1_CONFIG.d20Sides) {
    throw new RangeError(`natural d20 must be an integer from 1 to ${M1_CONFIG.d20Sides}; received ${natural}`);
  }
  if (!Number.isSafeInteger(accuracy) || !Number.isSafeInteger(evasion)) {
    throw new RangeError('accuracy and evasion must be safe integers');
  }
  const attackTotal = natural + accuracy;
  const armorClass = M1_CONFIG.acBase + evasion;
  if (natural === 1) {
    return { natural, attackTotal, armorClass, hit: false, critical: false };
  }
  if (natural === M1_CONFIG.d20Sides) {
    return { natural, attackTotal, armorClass, hit: true, critical: true };
  }
  return { natural, attackTotal, armorClass, hit: attackTotal >= armorClass, critical: false };
}
