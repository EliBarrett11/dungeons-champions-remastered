import { M1_CONFIG } from '../config';
import { parseDiceExpression } from '../dice/parse';
import type { DiceExpression } from '../dice/parse';
import { BattleRng } from '../rng/rng';
import type { Rng } from '../rng/rng';
import { rollDie } from '../rng/dice';
import { drawSideAssignment } from '../rng/sides';
import { attackIntervalMs, firstActualAttackAtMs } from '../rules/interval';
import { initiativeTotal, openingUltimateWinners, skipsFirstAttack } from '../rules/initiative';
import { sortByActionOrder } from '../rules/ordering';
import type { Side, UnitStats } from '../types';
import { assertValidBattleInput } from '../validate';
import { LOG_VERSION } from './events';
import type { SetupEvent } from './events';

/** A unit's state after setup. Combat steps update health, defeated, timers and target. */
export interface UnitState {
  readonly id: string;
  readonly participantId: string;
  readonly side: Side;
  readonly slot: number;
  readonly stats: UnitStats;
  readonly attack: {
    readonly dice: DiceExpression;
    readonly scalingRatioBp: number;
    readonly damageType: 'physical';
  };
  health: number;
  defeated: boolean;
  readonly initiativeNatural: number;
  readonly initiativeTotal: number;
  readonly skipsFirstAttack: boolean;
  readonly intervalMs: number;
  /** Next timer expiry. Starts at one interval (I-2); the skipping unit's first expiry commits nothing. */
  nextTimerAtMs: number;
  /** True until the skipping unit's first timer expiry has passed (P-008). */
  skipPending: boolean;
  /** Current Basic Attack target (P-003, I-8); none before the first commitment. */
  targetId: string | null;
}

export interface BattleSetup {
  readonly seed: number;
  readonly sides: { readonly A: string; readonly B: string };
  /** Units in initiative-roll order: side A by ascending slot, then side B by ascending slot. */
  readonly units: readonly UnitState[];
  /** Unit ids in P-010 order. */
  readonly actionOrder: readonly string[];
  /** C-001/C-002 winners in P-010 order. Recorded only in M1. */
  readonly openingUltimateWinners: readonly string[];
  readonly events: readonly SetupEvent[];
  /** The battle's generator, positioned after the setup draws. */
  readonly rng: Rng;
}

export interface SetupOptions {
  /** Creates the battle's generator. Defaults to the seeded sfc32 BattleRng; tests may substitute one. */
  readonly createRng?: (seed: number) => Rng;
}

function parsedDice(text: string): DiceExpression {
  const parsed = parseDiceExpression(text);
  if (!parsed.ok) {
    // Unreachable: validation has already accepted every dice expression.
    throw new Error(`internal error: dice expression failed after validation: ${parsed.error}`);
  }
  return parsed.value;
}

/**
 * Battle setup (M1 plan step 5). Order of work:
 * 1. Validate the input; an invalid input throws InvalidBattleInputError before any generator exists.
 * 2. Create the battle generator from the seed (P-009).
 * 3. Side assignment from the first output (I-5).
 * 4. One d20 initiative roll per unit: side A then side B, ascending slot (ruleset section 9.2).
 * 5. Totals, skip flags (P-008), opening-Ultimate winners (C-001/C-002), P-010 order, timers (I-2).
 */
export function setupBattle(input: unknown, options: SetupOptions = {}): BattleSetup {
  assertValidBattleInput(input);

  const rng = (options.createRng ?? ((seed: number) => new BattleRng(seed)))(input.seed);
  const assignment = drawSideAssignment(rng);
  const participantA = input.participants[assignment.sideAParticipant];
  const participantB = input.participants[assignment.sideBParticipant];

  const bySlot = (side: Side, participant: typeof participantA) =>
    [...participant.units]
      .sort((a, b) => a.slot - b.slot)
      .map((unit) => ({ unit, side, participantId: participant.id }));
  const rollOrder = [...bySlot('A', participantA), ...bySlot('B', participantB)];

  const rolled = rollOrder.map((entry) => {
    const natural = rollDie(rng, M1_CONFIG.d20Sides);
    return { ...entry, natural, total: initiativeTotal(natural, entry.unit.stats.initiativeModifier) };
  });

  const totals = rolled.map((r) => r.total);
  const skipFlags = skipsFirstAttack(totals);
  const winnerIndexes = new Set(openingUltimateWinners(totals));

  const units: UnitState[] = rolled.map((r, index) => {
    const intervalMs = attackIntervalMs(r.unit.stats.attackSpeedMilli);
    const skips = skipFlags[index] === true;
    return {
      id: r.unit.id,
      participantId: r.participantId,
      side: r.side,
      slot: r.unit.slot,
      stats: r.unit.stats,
      attack: {
        dice: parsedDice(r.unit.basicAttack.dice),
        scalingRatioBp: r.unit.basicAttack.scalingRatioBp,
        damageType: r.unit.basicAttack.damageType,
      },
      health: r.unit.stats.health,
      defeated: false,
      initiativeNatural: r.natural,
      initiativeTotal: r.total,
      skipsFirstAttack: skips,
      intervalMs,
      nextTimerAtMs: intervalMs,
      skipPending: skips,
      targetId: null,
    };
  });

  const ordered = sortByActionOrder(
    units.map((unit, index) => ({ unit, index, initiativeTotal: unit.initiativeTotal, side: unit.side, slot: unit.slot })),
  );
  const actionOrder = ordered.map((o) => o.unit.id);
  const winners = ordered.filter((o) => winnerIndexes.has(o.index)).map((o) => o.unit.id);

  const events: SetupEvent[] = [
    {
      type: 'battleStart',
      t: 0,
      logVersion: LOG_VERSION,
      seed: input.seed,
      participants: input.participants.map((p) => ({
        id: p.id,
        units: [...p.units].sort((a, b) => a.slot - b.slot).map((u) => ({ id: u.id, slot: u.slot })),
      })),
    },
    { type: 'sidesAssigned', t: 0, u: assignment.u, sideA: participantA.id, sideB: participantB.id },
    ...units.map((unit) => ({
      type: 'initiativeRolled' as const,
      t: 0 as const,
      unitId: unit.id,
      side: unit.side,
      slot: unit.slot,
      natural: unit.initiativeNatural,
      modifier: unit.stats.initiativeModifier,
      total: unit.initiativeTotal,
    })),
    {
      type: 'initiativeResolved',
      t: 0,
      order: actionOrder,
      openingUltimateWinners: winners,
      units: ordered.map(({ unit }) => ({
        unitId: unit.id,
        total: unit.initiativeTotal,
        skipsFirstAttack: unit.skipsFirstAttack,
        intervalMs: unit.intervalMs,
        firstTimerAtMs: unit.nextTimerAtMs,
        firstAttackAtMs: firstActualAttackAtMs(unit.intervalMs, unit.skipsFirstAttack),
      })),
    },
  ];

  return {
    seed: input.seed,
    sides: { A: participantA.id, B: participantB.id },
    units,
    actionOrder,
    openingUltimateWinners: winners,
    events,
    rng,
  };
}
