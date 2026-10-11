import { M1_CONFIG } from '../config';
import { rollDiceExpression } from '../dice/parse';
import { rollDie } from '../rng/dice';
import { computeHitDamage } from '../rules/damage';
import { resolveHit } from '../rules/hit';
import { sortByActionOrder } from '../rules/ordering';
import { overtimeBoundariesMs, overtimeMultiplier } from '../rules/overtime';
import { selectTarget } from '../rules/targeting';
import type { Side } from '../types';
import type { AttackCommittedEvent, BattleEvent, BattleOutcome } from './events';
import { nextMoment } from './schedule';
import { setupBattle } from './setup';
import type { SetupOptions, UnitState } from './setup';

export interface BattleResult {
  readonly outcome: BattleOutcome;
  readonly endTimeMs: number;
  readonly sides: { readonly A: string; readonly B: string };
  /** Final state of every unit, in initiative-roll order (side A by slot, then side B by slot). */
  readonly units: readonly { readonly id: string; readonly side: Side; readonly health: number; readonly defeated: boolean }[];
  readonly events: readonly BattleEvent[];
}

/** A committed Basic Attack: its stored outcome, fixed at commitment (P-014). */
type StoredAttack = Readonly<AttackCommittedEvent>;

/**
 * Runs one M1 battle (headless deterministic duel). Order of work:
 * - setupBattle: validation first (InvalidBattleInputError, no randomness), then sides,
 *   initiative, skips, order and timers.
 * - Moment loop, at each timestamp t chosen by nextMoment (earlier of the next timer of a
 *   non-defeated unit and the next overtime boundary; stop at exactly 60,000 ms, I-4):
 *   1. overtime boundary: overtimeStep, before anything else at t;
 *   2. commitment (P-013 step 2): eligible units in P-010 order; a pending skip is logged with no
 *      draws; otherwise the target is chosen, the d20 rolled, and on a hit the damage dice rolled
 *      and the complete damage calculated (P-014, section 9.2); nothing changes Health;
 *   3. ready Ultimates (P-013 step 3): none exist in M1, so this stage is empty;
 *   4. resolution (P-013 step 4): stored attacks applied in P-010 order, Health clamped at 0,
 *      excess damage logged (P-012); defeat logged right after the damage that caused it;
 *   5. battle result decided only after every action at t has resolved (P-006).
 */
export function runBattle(input: unknown, options: SetupOptions = {}): BattleResult {
  const setup = setupBattle(input, options);
  const { rng } = setup;
  const units: UnitState[] = [...setup.units];
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const events: BattleEvent[] = [...setup.events];
  const boundaries = overtimeBoundariesMs();
  let boundaryIndex = 0;

  const enemiesOf = (unit: UnitState) => units.filter((other) => other.side !== unit.side);
  const sideAlive = (side: Side) => units.some((unit) => unit.side === side && !unit.defeated);

  for (;;) {
    const alive = units.filter((unit) => !unit.defeated);
    const moment = nextMoment(
      alive.map((unit) => unit.nextTimerAtMs),
      boundaries.slice(boundaryIndex),
      M1_CONFIG.hardStopMs,
    );

    if (moment.kind === 'hardStop') {
      // Both sides still have a Champion standing; nothing at or after the hard stop resolves.
      return finish(setup.sides, units, events, moment.t, { kind: 'draw', reason: 'hardStop' });
    }

    const { t } = moment;

    // 1. Overtime boundary.
    if (moment.boundary) {
      events.push({ type: 'overtimeStep', t, multiplier: overtimeMultiplier(t) });
      boundaryIndex += 1;
    }
    if (!moment.attacks) {
      continue;
    }

    // 2. Commitment stage.
    const due = sortByActionOrder(alive.filter((unit) => unit.nextTimerAtMs === t));
    const multiplier = overtimeMultiplier(t);
    const committed: StoredAttack[] = [];
    for (const attacker of due) {
      attacker.nextTimerAtMs = t + attacker.intervalMs;
      if (attacker.skipPending) {
        attacker.skipPending = false;
        events.push({ type: 'attackSkipped', t, unitId: attacker.id });
        continue;
      }
      const targetId = selectTarget(attacker.targetId, enemiesOf(attacker));
      if (targetId === null) {
        continue; // No enemy alive: nothing is committed (I-8).
      }
      attacker.targetId = targetId;
      const target = byId.get(targetId)!;

      const natural = rollDie(rng, M1_CONFIG.d20Sides);
      const hit = resolveHit({ natural, accuracy: attacker.stats.accuracy, evasion: target.stats.evasion });
      let dice: readonly number[] = [];
      let diceTotal: number | null = null;
      let damage: number | null = null;
      if (hit.hit) {
        const roll = rollDiceExpression(rng, attacker.attack.dice);
        dice = roll.dice;
        diceTotal = roll.total;
        damage = computeHitDamage({
          diceTotal: roll.total,
          scalingStat: attacker.stats.attack,
          scalingRatioBp: attacker.attack.scalingRatioBp,
          critical: hit.critical,
          damageType: attacker.attack.damageType,
          armor: target.stats.armor,
          overtimeMultiplier: multiplier,
        }).damage;
      }
      const stored: StoredAttack = Object.freeze({
        type: 'attackCommitted',
        t,
        attackerId: attacker.id,
        targetId,
        natural,
        attackTotal: hit.attackTotal,
        armorClass: hit.armorClass,
        hit: hit.hit,
        critical: hit.critical,
        dice: Object.freeze([...dice]),
        diceTotal,
        overtimeMultiplier: multiplier,
        damage,
      });
      committed.push(stored);
      events.push(stored);
    }

    // 3. Ready Ultimates: none in M1 (Ultimates are out of scope); the stage is intentionally empty.

    // 4. Resolution stage, in P-010 order (the commitment order).
    for (const attack of committed) {
      const target = byId.get(attack.targetId)!;
      const healthBefore = target.health;
      const damage = attack.hit ? attack.damage! : 0;
      const healthRemoved = Math.min(damage, healthBefore);
      target.health = healthBefore - healthRemoved;
      events.push({
        type: 'attackResolved',
        t,
        attackerId: attack.attackerId,
        targetId: attack.targetId,
        hit: attack.hit,
        damage,
        healthBefore,
        healthRemoved,
        healthAfter: target.health,
        excessDamage: damage - healthRemoved,
      });
      if (!target.defeated && target.health === 0) {
        target.defeated = true;
        events.push({ type: 'unitDefeated', t, unitId: target.id });
      }
    }

    // 5. Battle result, after every action at t has resolved.
    const aAlive = sideAlive('A');
    const bAlive = sideAlive('B');
    if (!aAlive && !bAlive) {
      return finish(setup.sides, units, events, t, { kind: 'draw', reason: 'mutualDefeat' });
    }
    if (!aAlive || !bAlive) {
      const winnerSide: Side = aAlive ? 'A' : 'B';
      return finish(setup.sides, units, events, t, { kind: 'win', winner: setup.sides[winnerSide], winnerSide });
    }
  }
}

function finish(
  sides: { readonly A: string; readonly B: string },
  units: readonly UnitState[],
  events: BattleEvent[],
  t: number,
  outcome: BattleOutcome,
): BattleResult {
  events.push({ type: 'battleEnd', t, outcome });
  return {
    outcome,
    endTimeMs: t,
    sides,
    units: units.map((unit) => ({ id: unit.id, side: unit.side, health: unit.health, defeated: unit.defeated })),
    events,
  };
}
