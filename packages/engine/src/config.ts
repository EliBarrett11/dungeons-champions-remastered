/**
 * Every tunable number used by the M1 engine lives here (M1 acceptance 5).
 * Values are PROVISIONAL prototype rules; see docs/COMBAT/PROTOTYPE_RULESET_V0.md.
 * Nothing in this module is a CONFIRMED final game rule.
 */
export const M1_CONFIG = Object.freeze({
  /** Battle stops at this timestamp before any action scheduled there resolves (I-4). */
  hardStopMs: 60_000,
  /** Overtime multiplier becomes x2 at this timestamp (I-3). */
  overtimeStartMs: 30_000,
  /** Overtime multiplier doubles every this many ms after overtimeStartMs (I-3). */
  overtimeStepMs: 5_000,
  /** AC = acBase + Evasion (P-004). */
  acBase: 10,
  /** Sides of the attack and initiative die (P-004, P-008). */
  d20Sides: 20,
  /** Standard critical-hit multiplier, applied to the whole base amount (P-005). */
  critMultiplier: 2,
  /** Physical mitigation: x armorConstant / (armorConstant + max(0, Armor)) (P-005). */
  armorConstant: 100,
  /** A hit deals at least this much damage per component (P-005). */
  minDamageOnHit: 1,
  /** Scaling ratios are integers in basis points (I-9). */
  ratioDenominator: 10_000,
  /** Attack speed is an integer in thousandths of an attack per second (I-9). */
  attackSpeedDenominator: 1_000,
  /** Board slots per side; front 0-2, middle 3-6, back 7-11 (P-003, I-1). */
  boardSlots: 12,
  /** Test units per side in M1 (roadmap M1 scope). */
  minUnitsPerSide: 1,
  maxUnitsPerSide: 5,
});

export type M1Config = typeof M1_CONFIG;
