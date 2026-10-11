/** Battle side, assigned from the battle seed (I-5). */
export type Side = 'A' | 'B';

/** A Champion's combat stats for M1. All values are integers (I-9). */
export interface UnitStats {
  /** Starting Health; at least 1. */
  readonly health: number;
  readonly attack: number;
  /** Not negative (champion-combat schema minimum 0). */
  readonly armor: number;
  readonly accuracy: number;
  readonly evasion: number;
  /** Attacks per second in thousandths (I-9): 0.65 is 650. */
  readonly attackSpeedMilli: number;
  /** Always explicit in the engine; the I-7 "+0 when missing" default applies only in test fixtures. */
  readonly initiativeModifier: number;
}

/** M1 Basic Attack definition (P-005, P-015). */
export interface BasicAttackInput {
  /** Dice expression: NdM, NdM+K or NdM-K. */
  readonly dice: string;
  readonly scalingStat: 'attack';
  /** Scaling ratio in basis points (I-9): 1.0 is 10,000. */
  readonly scalingRatioBp: number;
  readonly damageType: 'physical';
}

export interface UnitInput {
  /** Unique across the whole battle. */
  readonly id: string;
  /** Board slot 0-11 (I-1), unique within its side. */
  readonly slot: number;
  readonly stats: UnitStats;
  readonly basicAttack: BasicAttackInput;
}

export interface ParticipantInput {
  readonly id: string;
  /** One to five units in M1. */
  readonly units: readonly UnitInput[];
}

export interface BattleInput {
  /** Battle seed, a uint32 (P-009, I-5). */
  readonly seed: number;
  /** Participant 0 and participant 1, in input order (I-5). */
  readonly participants: readonly [ParticipantInput, ParticipantInput];
}

/** One input problem, located by a path such as `participants[0].units[2].stats.health`. */
export interface ValidationError {
  readonly path: string;
  readonly message: string;
}
