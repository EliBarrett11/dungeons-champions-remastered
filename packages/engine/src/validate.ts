import { M1_CONFIG } from './config';
import { parseDiceExpression } from './dice/parse';
import { isUint32 } from './rng/sfc32';
import type { BattleInput, ValidationError } from './types';

/**
 * Battle-input validation (M1 plan section 8). Pure: it reads the input only, never creates a
 * random-number generator and never starts a battle, so an invalid input consumes no randomness.
 * Every problem is collected; validation does not stop at the first error.
 */

type Fields = Record<string, unknown>;

function isRecord(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

class Collector {
  readonly errors: ValidationError[] = [];

  add(path: string, message: string): void {
    this.errors.push({ path, message });
  }

  /** Requires a safe integer within [min, max]; reports one error otherwise. */
  integer(path: string, value: unknown, min: number, max: number): value is number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
      this.add(path, `must be an integer; received ${describe(value)}`);
      return false;
    }
    if (value < min || value > max) {
      this.add(path, `must be from ${min} to ${max}; received ${value}`);
      return false;
    }
    return true;
  }

  nonEmptyString(path: string, value: unknown): value is string {
    if (typeof value !== 'string' || value.length === 0) {
      this.add(path, `must be a non-empty string; received ${describe(value)}`);
      return false;
    }
    return true;
  }

  record(path: string, value: unknown): value is Fields {
    if (!isRecord(value)) {
      this.add(path, `must be an object; received ${describe(value)}`);
      return false;
    }
    return true;
  }
}

function describe(value: unknown): string {
  if (value === undefined) return 'undefined (missing)';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  return `a ${typeof value}`;
}

const STAT_LIMIT = M1_CONFIG.maxStatMagnitude;

function validateStats(c: Collector, path: string, stats: unknown): void {
  if (!c.record(path, stats)) return;
  c.integer(`${path}.health`, stats['health'], 1, STAT_LIMIT);
  c.integer(`${path}.attack`, stats['attack'], -STAT_LIMIT, STAT_LIMIT);
  c.integer(`${path}.armor`, stats['armor'], 0, STAT_LIMIT);
  c.integer(`${path}.accuracy`, stats['accuracy'], -STAT_LIMIT, STAT_LIMIT);
  c.integer(`${path}.evasion`, stats['evasion'], -STAT_LIMIT, STAT_LIMIT);
  c.integer(`${path}.attackSpeedMilli`, stats['attackSpeedMilli'], 1, M1_CONFIG.maxAttackSpeedMilli);
  c.integer(`${path}.initiativeModifier`, stats['initiativeModifier'], -STAT_LIMIT, STAT_LIMIT);
}

function validateBasicAttack(c: Collector, path: string, attack: unknown): void {
  if (!c.record(path, attack)) return;
  const dice = attack['dice'];
  if (typeof dice !== 'string') {
    c.add(`${path}.dice`, `must be a dice-expression string; received ${describe(dice)}`);
  } else {
    const parsed = parseDiceExpression(dice);
    if (!parsed.ok) {
      c.add(`${path}.dice`, parsed.error);
    }
  }
  if (attack['scalingStat'] !== 'attack') {
    c.add(`${path}.scalingStat`, `must be "attack" in M1 (P-015); received ${describe(attack['scalingStat'])}`);
  }
  c.integer(`${path}.scalingRatioBp`, attack['scalingRatioBp'], 0, M1_CONFIG.maxScalingRatioBp);
  if (attack['damageType'] !== 'physical') {
    c.add(`${path}.damageType`, `must be "physical" in M1 (P-015); received ${describe(attack['damageType'])}`);
  }
}

function validateParticipant(c: Collector, path: string, participant: unknown, unitIds: Map<string, string>): void {
  if (!c.record(path, participant)) return;
  c.nonEmptyString(`${path}.id`, participant['id']);

  const units = participant['units'];
  if (!Array.isArray(units)) {
    c.add(`${path}.units`, `must be an array; received ${describe(units)}`);
    return;
  }
  if (units.length < M1_CONFIG.minUnitsPerSide || units.length > M1_CONFIG.maxUnitsPerSide) {
    c.add(
      `${path}.units`,
      `must contain ${M1_CONFIG.minUnitsPerSide} to ${M1_CONFIG.maxUnitsPerSide} units; received ${units.length}`,
    );
  }

  const slots = new Map<number, string>();
  units.forEach((unit: unknown, index: number) => {
    const unitPath = `${path}.units[${index}]`;
    if (!c.record(unitPath, unit)) return;

    const id = unit['id'];
    if (c.nonEmptyString(`${unitPath}.id`, id)) {
      const firstPath = unitIds.get(id);
      if (firstPath !== undefined) {
        c.add(`${unitPath}.id`, `duplicate unit id ${JSON.stringify(id)}; already used at ${firstPath}`);
      } else {
        unitIds.set(id, `${unitPath}.id`);
      }
    }

    const slot = unit['slot'];
    if (c.integer(`${unitPath}.slot`, slot, 0, M1_CONFIG.boardSlots - 1)) {
      const firstPath = slots.get(slot);
      if (firstPath !== undefined) {
        c.add(`${unitPath}.slot`, `duplicate slot ${slot} on this side; already used at ${firstPath}`);
      } else {
        slots.set(slot, `${unitPath}.slot`);
      }
    }

    validateStats(c, `${unitPath}.stats`, unit['stats']);
    validateBasicAttack(c, `${unitPath}.basicAttack`, unit['basicAttack']);
  });
}

/** Returns every problem with `input`; an empty array means the input is a valid BattleInput. */
export function validateBattleInput(input: unknown): ValidationError[] {
  const c = new Collector();
  if (!c.record('input', input)) return c.errors;

  const seed = input['seed'];
  if (typeof seed !== 'number' || !isUint32(seed)) {
    c.add('seed', `must be an integer from 0 to 4294967295 (uint32); received ${describe(seed)}`);
  }

  const participants = input['participants'];
  if (!Array.isArray(participants)) {
    c.add('participants', `must be an array of exactly 2 participants; received ${describe(participants)}`);
    return c.errors;
  }
  if (participants.length !== 2) {
    c.add('participants', `must contain exactly 2 participants; received ${participants.length}`);
  }

  const unitIds = new Map<string, string>();
  const participantIds = new Map<string, string>();
  participants.forEach((participant: unknown, index: number) => {
    const path = `participants[${index}]`;
    validateParticipant(c, path, participant, unitIds);
    if (isRecord(participant) && typeof participant['id'] === 'string' && participant['id'].length > 0) {
      const id = participant['id'];
      const firstPath = participantIds.get(id);
      if (firstPath !== undefined) {
        c.add(`${path}.id`, `duplicate participant id ${JSON.stringify(id)}; already used at ${firstPath}`);
      } else {
        participantIds.set(id, `${path}.id`);
      }
    }
  });

  return c.errors;
}

/** Thrown when a battle input is invalid; carries every validation error. */
export class InvalidBattleInputError extends Error {
  readonly errors: readonly ValidationError[];

  constructor(errors: readonly ValidationError[]) {
    super(
      `invalid battle input (${errors.length} error${errors.length === 1 ? '' : 's'}): ` +
        errors.map((e) => `${e.path}: ${e.message}`).join('; '),
    );
    this.name = 'InvalidBattleInputError';
    this.errors = errors;
  }
}

/**
 * The input-validation step of runBattle (M1 plan section 8): throws InvalidBattleInputError with
 * every problem, before any battle state or random-number generator exists. runBattle (step 6)
 * calls this first.
 */
export function assertValidBattleInput(input: unknown): asserts input is BattleInput {
  const errors = validateBattleInput(input);
  if (errors.length > 0) {
    throw new InvalidBattleInputError(errors);
  }
}
