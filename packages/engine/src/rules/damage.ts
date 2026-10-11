import { M1_CONFIG } from '../config';

export interface HitDamageInput {
  /**
   * P-005's "dice roll": the total of the attack's dice expression, i.e. the sum of the dice
   * plus the expression's flat modifier K. Interpretation recorded in the step 3 report: the
   * authoring guide defines NdM+K as adding K to the roll; P-015's fixture has K = 0.
   */
  readonly diceTotal: number;
  /** The scaling stat's value (Attack for the P-015 fixture). */
  readonly scalingStat: number;
  /** Scaling ratio in basis points (I-9); 10,000 = x1.0. */
  readonly scalingRatioBp: number;
  readonly critical: boolean;
  /** M1 has one physical damage type, mitigated by Armor (P-005 step 3). */
  readonly damageType: 'physical';
  readonly armor: number;
  /** From overtimeMultiplier(t) at the commitment timestamp (I-3). */
  readonly overtimeMultiplier: number;
}

export interface HitDamage {
  /** Final damage of the component, at least 1. */
  readonly damage: number;
  /** Exact pre-rounding value as numerator / denominator (I-9), for logging and tests. */
  readonly numerator: bigint;
  readonly denominator: bigint;
}

function assertSafeInteger(name: string, value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer; received ${value}`);
  }
}

/** floor(n / d) toward negative infinity, for d > 0 (BigInt division truncates toward zero). */
function floorDiv(n: bigint, d: bigint): bigint {
  const q = n / d;
  return n % d !== 0n && n < 0n ? q - 1n : q;
}

/**
 * Damage of one component of an attack that HIT, per P-005 in this exact order, using the
 * I-9 exact-fraction representation (no floating point):
 *   1. base = diceTotal + scalingStat x ratio          n = diceTotal x 10,000 + stat x r, d = 10,000
 *   2. critical hit: x2 of the whole base              n = n x 2
 *   3. physical: x 100 / (100 + max(0, Armor))         n = n x 100, d = d x (100 + max(0, Armor))
 *   4. overtime multiplier                             n = n x multiplier
 *   5. round down once (floor toward negative infinity)
 *   6. at least 1 damage on a hit
 * Callers must not use this for misses: a miss rolls no damage dice and deals no damage (I-6, P-014).
 */
export function computeHitDamage(input: HitDamageInput): HitDamage {
  assertSafeInteger('diceTotal', input.diceTotal);
  assertSafeInteger('scalingStat', input.scalingStat);
  assertSafeInteger('scalingRatioBp', input.scalingRatioBp);
  assertSafeInteger('armor', input.armor);
  assertSafeInteger('overtimeMultiplier', input.overtimeMultiplier);
  if (input.scalingRatioBp < 0) {
    throw new RangeError(`scalingRatioBp must not be negative; received ${input.scalingRatioBp}`);
  }
  if (input.overtimeMultiplier < 1) {
    throw new RangeError(`overtimeMultiplier must be at least 1; received ${input.overtimeMultiplier}`);
  }
  if (input.damageType !== 'physical') {
    throw new RangeError(`unsupported damage type in M1: ${String(input.damageType)}`);
  }

  const ratioDenominator = BigInt(M1_CONFIG.ratioDenominator);
  const armorConstant = BigInt(M1_CONFIG.armorConstant);

  let numerator = BigInt(input.diceTotal) * ratioDenominator + BigInt(input.scalingStat) * BigInt(input.scalingRatioBp);
  let denominator = ratioDenominator;
  if (input.critical) {
    numerator *= BigInt(M1_CONFIG.critMultiplier);
  }
  numerator *= armorConstant;
  denominator *= armorConstant + BigInt(Math.max(0, input.armor));
  numerator *= BigInt(input.overtimeMultiplier);

  const floored = floorDiv(numerator, denominator);
  const atLeastMinimum = floored < BigInt(M1_CONFIG.minDamageOnHit) ? BigInt(M1_CONFIG.minDamageOnHit) : floored;
  if (atLeastMinimum > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`damage ${atLeastMinimum} exceeds the safe integer range`);
  }
  return { damage: Number(atLeastMinimum), numerator, denominator };
}
