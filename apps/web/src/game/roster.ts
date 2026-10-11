import rosterSchema from '../../../../docs/COMBAT/schemas/roster.schema.json';

/**
 * The approved Champion roster (M3; DECISIONS.md D-017 to D-021).
 *
 * Approved: Champion IDs, names, and Class/Race/Origin assignments. Everything under `proposed`
 * (cost rank, rarity, Role, ability and Feat text) is PROPOSED content: kept for display and later
 * design work, never executed by the engine. The canonical trait names are read from
 * docs/COMBAT/schemas/roster.schema.json, so the schema, the content check and this validator share
 * one list.
 */

export interface ProposedChampionContent {
  readonly cost_rank: number;
  readonly rarity: string;
  readonly role: string;
  readonly basic_attack: string;
  readonly passive: string;
  readonly ultimate: string;
  readonly feat_milestone_1: string;
  /** Absent when the source text described Multi-Class (D-020; see `excluded`). */
  readonly feat_milestone_2?: string;
  readonly design_status: string;
  readonly notes: string;
}

export interface RosterChampion {
  readonly id: string;
  readonly name: string;
  readonly class: string;
  readonly race: string;
  readonly origin: string;
  readonly proposed: ProposedChampionContent;
  readonly excluded?: { readonly feat_milestone_2?: string };
}

export interface Roster {
  readonly format: string;
  readonly approval: string;
  readonly source: { readonly file: string; readonly sheet: string; readonly sha256: string };
  readonly champions: readonly RosterChampion[];
}

export interface TraitCanon {
  readonly classes: readonly string[];
  readonly races: readonly string[];
  readonly origins: readonly string[];
}

/** D-017: confirmed roster shape (not tunable). */
export const ROSTER_RULES = Object.freeze({
  size: 135,
  championsPerTrait: 9,
});

/** The nine documented Roles (PROJECT_BRIEF.md, CHAMPIONS.md). */
export const DOCUMENTED_ROLES: readonly string[] = Object.freeze([
  'Tank', 'Bruiser', 'Assassin', 'Skirmisher', 'Marksman', 'Artillery', 'Mage', 'Controller', 'Support',
]);

/** The 45 canonical trait names, from roster.schema.json $defs. */
export const TRAIT_CANON: TraitCanon = Object.freeze({
  classes: Object.freeze([...rosterSchema.$defs.className.enum]),
  races: Object.freeze([...rosterSchema.$defs.raceName.enum]),
  origins: Object.freeze([...rosterSchema.$defs.originName.enum]),
});

export interface RosterValidation {
  /** The roster, typed, when there are no errors; otherwise null. */
  readonly roster: Roster | null;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

const CHAMPION_FIELDS = new Set(['id', 'name', 'class', 'race', 'origin', 'proposed', 'excluded']);
const PROPOSED_TEXT_FIELDS = [
  'rarity', 'role', 'basic_attack', 'passive', 'ultimate', 'feat_milestone_1', 'design_status', 'notes',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Strict roster validation. Errors make the roster unusable; warnings flag PROPOSED content that
 * the prototype tolerates (Roles outside the documented list, excluded Multi-Class text).
 */
export function validateRoster(input: unknown, canon: TraitCanon = TRAIT_CANON): RosterValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(input)) return { roster: null, errors: ['The roster is not an object.'], warnings };
  if (input.format !== 'dc-roster-v1') errors.push(`Unknown roster format ${JSON.stringify(input.format)}; expected "dc-roster-v1".`);
  const champions = input.champions;
  if (!Array.isArray(champions)) return { roster: null, errors: [...errors, 'The roster has no champions list.'], warnings };
  if (champions.length !== ROSTER_RULES.size) {
    errors.push(`The roster has ${champions.length} Champions; exactly ${ROSTER_RULES.size} are required (D-017).`);
  }

  const lists = { class: canon.classes, race: canon.races, origin: canon.origins } as const;
  const counts = {
    class: new Map(canon.classes.map((name) => [name, 0])),
    race: new Map(canon.races.map((name) => [name, 0])),
    origin: new Map(canon.origins.map((name) => [name, 0])),
  };
  const ids = new Map<string, number>();
  const combinations = new Map<string, string>();
  const offRole = new Map<string, number>();
  let excludedFeats = 0;

  champions.forEach((entry: unknown, index) => {
    const at = `Champion #${index + 1}`;
    if (!isRecord(entry)) {
      errors.push(`${at} is not an object.`);
      return;
    }
    const label = isText(entry.id) ? `${at} (${entry.id})` : at;
    for (const key of Object.keys(entry)) {
      if (!CHAMPION_FIELDS.has(key)) errors.push(`${label} has an unexpected field "${key}" (Multi-Class and other new mechanics are not active).`);
    }
    if (!isText(entry.id)) {
      errors.push(`${at} has a missing or blank ID.`);
    } else if (!/^DC-\d{3}$/.test(entry.id)) {
      errors.push(`${label}: ID must look like DC-001.`);
    } else if (ids.has(entry.id)) {
      errors.push(`${label}: duplicate ID (also Champion #${ids.get(entry.id)! + 1}).`);
    } else {
      ids.set(entry.id, index);
    }
    if (!isText(entry.name)) errors.push(`${label} has a missing or blank name.`);

    let traitsValid = true;
    for (const kind of ['class', 'race', 'origin'] as const) {
      const value = entry[kind];
      if (typeof value !== 'string' || !lists[kind].includes(value)) {
        traitsValid = false;
        errors.push(`${label}: ${kind} ${JSON.stringify(value)} is not one of the approved ${kind === 'class' ? 'Classes' : kind === 'race' ? 'Races' : 'Origins'}.`);
      } else {
        counts[kind].set(value, counts[kind].get(value)! + 1);
      }
    }
    if (traitsValid) {
      const key = `${String(entry.class)} / ${String(entry.race)} / ${String(entry.origin)}`;
      const first = combinations.get(key);
      if (first) errors.push(`${label}: duplicate Class/Race/Origin combination ${key} (also ${first}).`);
      else combinations.set(key, isText(entry.id) ? entry.id : at);
    }

    const proposed = entry.proposed;
    if (!isRecord(proposed)) {
      errors.push(`${label} has no proposed content block.`);
    } else {
      const cost = proposed.cost_rank;
      if (typeof cost !== 'number' || !Number.isInteger(cost) || cost < 1 || cost > 5) {
        errors.push(`${label}: proposed cost rank must be a whole number from 1 to 5.`);
      }
      for (const field of PROPOSED_TEXT_FIELDS) {
        if (!isText(proposed[field])) errors.push(`${label}: proposed ${field} is missing or blank.`);
      }
      if ('feat_milestone_2' in proposed && !isText(proposed.feat_milestone_2)) {
        errors.push(`${label}: proposed feat_milestone_2 is blank.`);
      }
      if (isText(proposed.role) && !DOCUMENTED_ROLES.includes(proposed.role)) {
        offRole.set(proposed.role, (offRole.get(proposed.role) ?? 0) + 1);
      }
    }
    if (entry.excluded !== undefined) {
      if (!isRecord(entry.excluded) || Object.keys(entry.excluded).some((key) => key !== 'feat_milestone_2')) {
        errors.push(`${label}: "excluded" may only record feat_milestone_2.`);
      } else {
        excludedFeats += 1;
        if (isRecord(proposed) && 'feat_milestone_2' in proposed) {
          errors.push(`${label}: feat_milestone_2 is both present and excluded.`);
        }
      }
    }
  });

  for (const kind of ['class', 'race', 'origin'] as const) {
    for (const [name, count] of counts[kind]) {
      if (count !== ROSTER_RULES.championsPerTrait) {
        errors.push(`${kind[0]!.toUpperCase()}${kind.slice(1)} ${name} has ${count} Champions; exactly ${ROSTER_RULES.championsPerTrait} are required (D-017).`);
      }
    }
  }

  for (const [role, count] of [...offRole].sort(([a], [b]) => a.localeCompare(b))) {
    warnings.push(`PROPOSED Role "${role}" (${count} Champions) is not one of the nine documented Roles; the prototype uses a placeholder stat block.`);
  }
  if (excludedFeats > 0) {
    warnings.push(`${excludedFeats} Champions have Multi-Class Feat text excluded from playable data (D-020).`);
  }

  return { roster: errors.length === 0 ? (input as unknown as Roster) : null, errors, warnings };
}
