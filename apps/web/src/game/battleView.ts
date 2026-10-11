import type { BattleEvent } from '@dc/engine';
import { EXPEDITION_CONFIG } from './config';
import { championOf } from './expedition';
import type { BattleRecord, BenchChampion, PlayerOutcome } from './expedition';
import type { ExpeditionContent } from './fixtures';

/**
 * Read-only presentation of an engine battle log. Everything here is derived from the engine's
 * events: Health values come from `attackResolved.healthAfter`, defeats from `unitDefeated`, the
 * result from `battleEnd`. Nothing is recalculated, so playback speed or skipping cannot change
 * the outcome (AC-03, AC-09).
 */

export type Team = 'player' | 'monsters';

export interface ViewUnit {
  readonly id: string;
  readonly name: string;
  readonly team: Team;
  readonly slot: number;
  readonly maxHealth: number;
}

export interface LogLine {
  /** Index into the engine event list. */
  readonly eventIndex: number;
  readonly t: number;
  readonly text: string;
  readonly tone: 'neutral' | 'player' | 'monsters' | 'result';
}

export interface BattleView {
  readonly units: readonly ViewUnit[];
  readonly events: readonly BattleEvent[];
  readonly lines: readonly LogLine[];
  readonly endTimeMs: number;
  readonly outcome: PlayerOutcome;
}

export interface UnitSnapshot {
  readonly health: number;
  readonly defeated: boolean;
}

export function buildBattleView(record: BattleRecord, bench: readonly BenchChampion[], content: ExpeditionContent): BattleView {
  const encounter = content.encounters[record.encounterIndex];
  const units: ViewUnit[] = [];
  for (const participant of record.input.participants) {
    const team: Team = participant.id === EXPEDITION_CONFIG.playerParticipantId ? 'player' : 'monsters';
    participant.units.forEach((unit, index) => {
      let name = unit.id;
      if (team === 'player') {
        const instance = bench.find((entry) => entry.instanceId === unit.id);
        name = (instance && championOf(instance, content)?.name) ?? unit.id;
      } else {
        name = encounter?.monsters[index]?.name ?? unit.id;
      }
      units.push({ id: unit.id, name, team, slot: unit.slot, maxHealth: unit.stats.health });
    });
  }
  disambiguateNames(units);
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const lines: LogLine[] = [];
  record.result.events.forEach((event, eventIndex) => {
    const line = describeEvent(event, byId, record.outcome);
    if (line) lines.push({ eventIndex, t: event.t, ...line });
  });
  return { units, events: record.result.events, lines, endTimeMs: record.result.endTimeMs, outcome: record.outcome };
}

/** Adds "#2", "#3" to repeated names on the same team so log lines stay unambiguous. */
function disambiguateNames(units: ViewUnit[]): void {
  const counts = new Map<string, number>();
  units.forEach((unit, index) => {
    const key = `${unit.team}:${unit.name}`;
    const seen = (counts.get(key) ?? 0) + 1;
    counts.set(key, seen);
    if (seen > 1) units[index] = { ...unit, name: `${unit.name} #${seen}` };
  });
}

function describeEvent(
  event: BattleEvent,
  units: ReadonlyMap<string, ViewUnit>,
  outcome: PlayerOutcome,
): Omit<LogLine, 'eventIndex' | 't'> | null {
  const name = (id: string) => units.get(id)?.name ?? id;
  const tone = (id: string): LogLine['tone'] => units.get(id)?.team ?? 'neutral';
  switch (event.type) {
    case 'battleStart':
    case 'sidesAssigned':
    case 'initiativeRolled':
      return null;
    case 'initiativeResolved': {
      const order = event.order.map(name).join(', ');
      const skipping = event.units.filter((unit) => unit.skipsFirstAttack).map((unit) => name(unit.unitId));
      const skipText = skipping.length > 0 ? ` Slowest to act (first attack skipped): ${skipping.join(', ')}.` : '';
      return { text: `Initiative order: ${order}.${skipText}`, tone: 'neutral' };
    }
    case 'overtimeStep':
      return { text: `Overtime! All damage is now x${event.multiplier}.`, tone: 'neutral' };
    case 'attackSkipped':
      return { text: `${name(event.unitId)} loses its first attack (low initiative).`, tone: tone(event.unitId) };
    case 'attackCommitted': {
      const roll = `rolls ${event.natural} (total ${event.attackTotal} vs AC ${event.armorClass})`;
      const verdict = event.critical ? 'critical hit!' : event.hit ? 'hit' : 'miss';
      return { text: `${name(event.attackerId)} attacks ${name(event.targetId)}: ${roll}, ${verdict}`, tone: tone(event.attackerId) };
    }
    case 'attackResolved':
      if (!event.hit) return null;
      return {
        text: `${name(event.targetId)} takes ${event.damage} damage (${event.healthBefore} -> ${event.healthAfter} Health).`,
        tone: tone(event.attackerId),
      };
    case 'unitDefeated':
      return { text: `${name(event.unitId)} is defeated.`, tone: tone(event.unitId) === 'player' ? 'monsters' : 'player' };
    case 'battleEnd':
      return { text: outcomeText(outcome, event.outcome.kind === 'draw' ? event.outcome.reason : null), tone: 'result' };
  }
}

export function outcomeText(outcome: PlayerOutcome, drawReason: 'mutualDefeat' | 'hardStop' | null = null): string {
  if (outcome === 'victory') return 'Victory! Your team defeated the monsters.';
  if (outcome === 'defeat') return 'Defeat. The monsters defeated your team.';
  return drawReason === 'mutualDefeat'
    ? 'Draw: both teams fell at the same moment.'
    : 'Draw: the 60-second time limit was reached with both teams standing.';
}

/** Unit Health and defeat after the first `eventCount` engine events, read from the log. */
export function snapshotAfter(view: BattleView, eventCount: number): ReadonlyMap<string, UnitSnapshot> {
  const snapshot = new Map<string, UnitSnapshot>(view.units.map((unit) => [unit.id, { health: unit.maxHealth, defeated: false }]));
  for (const event of view.events.slice(0, eventCount)) {
    if (event.type === 'attackResolved') {
      const previous = snapshot.get(event.targetId);
      snapshot.set(event.targetId, { health: event.healthAfter, defeated: previous?.defeated ?? false });
    } else if (event.type === 'unitDefeated') {
      const previous = snapshot.get(event.unitId);
      snapshot.set(event.unitId, { health: previous?.health ?? 0, defeated: true });
    }
  }
  return snapshot;
}

/** Number of engine events whose timestamp is at or before `timeMs` (playback position). */
export function eventCountAt(view: BattleView, timeMs: number): number {
  let count = 0;
  while (count < view.events.length && view.events[count]!.t <= timeMs) count += 1;
  return count;
}
