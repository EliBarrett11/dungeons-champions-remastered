import type { Side } from '../types';

/**
 * Setup events (M1 plan section 7). Every field is a plain integer, string, boolean or array of
 * them, so the log serialises deterministically. Setup happens at t = 0. Later steps add the
 * combat events (overtimeStep, attackSkipped, attackCommitted, attackResolved, unitDefeated,
 * battleEnd).
 */
export const LOG_VERSION = 1;

export interface BattleStartEvent {
  readonly type: 'battleStart';
  readonly t: 0;
  readonly logVersion: typeof LOG_VERSION;
  readonly seed: number;
  /** Participants in input order (participant 0, participant 1), with their units by slot. */
  readonly participants: readonly {
    readonly id: string;
    readonly units: readonly { readonly id: string; readonly slot: number }[];
  }[];
}

export interface SidesAssignedEvent {
  readonly type: 'sidesAssigned';
  readonly t: 0;
  /** The battle's first generator output (I-5). */
  readonly u: number;
  readonly sideA: string;
  readonly sideB: string;
}

export interface InitiativeRolledEvent {
  readonly type: 'initiativeRolled';
  readonly t: 0;
  readonly unitId: string;
  readonly side: Side;
  readonly slot: number;
  readonly natural: number;
  readonly modifier: number;
  readonly total: number;
}

export interface InitiativeResolvedEvent {
  readonly type: 'initiativeResolved';
  readonly t: 0;
  /** Unit ids in P-010 order. */
  readonly order: readonly string[];
  /** C-001/C-002: every unit tied for the highest total, in P-010 order. Recorded only in M1. */
  readonly openingUltimateWinners: readonly string[];
  /** P-008 / I-2 per unit, in P-010 order. */
  readonly units: readonly {
    readonly unitId: string;
    readonly total: number;
    readonly skipsFirstAttack: boolean;
    readonly intervalMs: number;
    /** First timer expiry: one interval after battle start (I-2). */
    readonly firstTimerAtMs: number;
    /** First actual attack: one interval, or two for a skipping unit (I-2, P-008). */
    readonly firstAttackAtMs: number;
  }[];
}

export type SetupEvent = BattleStartEvent | SidesAssignedEvent | InitiativeRolledEvent | InitiativeResolvedEvent;

/** I-3: logged at each overtime boundary reached while the battle is running (before commitments). */
export interface OvertimeStepEvent {
  readonly type: 'overtimeStep';
  readonly t: number;
  readonly multiplier: number;
}

/** P-008: a skipping unit's first timer expiry; no attack, no random draws. */
export interface AttackSkippedEvent {
  readonly type: 'attackSkipped';
  readonly t: number;
  readonly unitId: string;
}

/** P-013 step 2 / P-014: the stored outcome, fixed at commitment. Health is not changed here. */
export interface AttackCommittedEvent {
  readonly type: 'attackCommitted';
  readonly t: number;
  readonly attackerId: string;
  readonly targetId: string;
  readonly natural: number;
  readonly attackTotal: number;
  readonly armorClass: number;
  readonly hit: boolean;
  readonly critical: boolean;
  /** Damage dice in rolling order; empty on a miss (no damage dice are drawn, I-6). */
  readonly dice: readonly number[];
  /** Dice-expression total including K (P-017); null on a miss. */
  readonly diceTotal: number | null;
  /** overtimeMultiplier(t) (I-3). */
  readonly overtimeMultiplier: number;
  /** Complete calculated damage (P-005); null on a miss. */
  readonly damage: number | null;
}

/** P-013 step 4 / P-012: the stored outcome applied in P-010 order, Health clamped at 0. */
export interface AttackResolvedEvent {
  readonly type: 'attackResolved';
  readonly t: number;
  readonly attackerId: string;
  readonly targetId: string;
  readonly hit: boolean;
  /** Stored damage (0 on a miss). */
  readonly damage: number;
  readonly healthBefore: number;
  readonly healthRemoved: number;
  readonly healthAfter: number;
  /** Damage beyond the Health remaining when applied (P-012); never part of Health. */
  readonly excessDamage: number;
}

export interface UnitDefeatedEvent {
  readonly type: 'unitDefeated';
  readonly t: number;
  readonly unitId: string;
}

export type BattleOutcome =
  | { readonly kind: 'win'; readonly winner: string; readonly winnerSide: Side }
  | { readonly kind: 'draw'; readonly reason: 'mutualDefeat' | 'hardStop' };

export interface BattleEndEvent {
  readonly type: 'battleEnd';
  readonly t: number;
  readonly outcome: BattleOutcome;
}

export type CombatEvent =
  | OvertimeStepEvent
  | AttackSkippedEvent
  | AttackCommittedEvent
  | AttackResolvedEvent
  | UnitDefeatedEvent
  | BattleEndEvent;

export type BattleEvent = SetupEvent | CombatEvent;
