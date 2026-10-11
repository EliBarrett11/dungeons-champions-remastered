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
