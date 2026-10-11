import type { BasicAttackInput, UnitStats } from '@dc/engine';
import rosterJson from '../../../../content/roster/champions.json';
import { FIXTURE_BASIC_ATTACK, ROLE_STATS } from './fixtures';
import type { FixtureRole } from './fixtures';
import { validateRoster } from './roster';
import type { ProposedChampionContent, RosterChampion, RosterValidation } from './roster';

/**
 * Playable Champions for the prototype (M3, P-022): the approved roster (D-021) plus TEMPORARY
 * combat numbers, because the roster defines no stats and the engine runs Basic Attacks only.
 *
 * - Stats: the P-007 Role table when the Champion's PROPOSED Role is one of its nine Roles;
 *   otherwise (Fighter, Ranger) a labelled placeholder: the rounded mean of the nine Role-table
 *   rows. Neither is a balance value. The Champion's Role is never changed.
 * - Basic Attack: the P-015 fixture attack (1d8 + Attack, physical) for every Champion. The
 *   roster's proposed Basic Attack, Passive, Ultimate and Feat text is shown, never executed.
 */

export type StatsSource = 'role-table' | 'placeholder';

export interface PlayableChampion {
  readonly id: string;
  readonly name: string;
  readonly class: string;
  readonly race: string;
  readonly origin: string;
  /** PROPOSED Role from the roster, unchanged. */
  readonly role: string;
  readonly statsSource: StatsSource;
  readonly stats: UnitStats;
  readonly basicAttack: BasicAttackInput;
  readonly proposed: ProposedChampionContent;
}

/** Roster Role names that have a P-007 Role-table row. */
const ROLE_TABLE: Readonly<Record<string, FixtureRole>> = Object.freeze({
  Tank: 'tank',
  Bruiser: 'bruiser',
  Assassin: 'assassin',
  Skirmisher: 'skirmisher',
  Marksman: 'marksman',
  Artillery: 'artillery',
  Mage: 'mage',
  Controller: 'controller',
  Support: 'support',
});

/** Rounded mean of every Role-table row: the temporary placeholder (P-022). */
export const PLACEHOLDER_STATS: UnitStats = Object.freeze(meanOfRoleTable());

function meanOfRoleTable(): UnitStats {
  const rows = Object.values(ROLE_STATS);
  const mean = (pick: (stats: UnitStats) => number) => Math.round(rows.reduce((sum, row) => sum + pick(row), 0) / rows.length);
  return {
    health: mean((s) => s.health),
    attack: mean((s) => s.attack),
    armor: mean((s) => s.armor),
    accuracy: mean((s) => s.accuracy),
    evasion: mean((s) => s.evasion),
    attackSpeedMilli: mean((s) => s.attackSpeedMilli),
    initiativeModifier: 0,
  };
}

export function playableChampion(champion: RosterChampion): PlayableChampion {
  const tableRole = ROLE_TABLE[champion.proposed.role];
  return {
    id: champion.id,
    name: champion.name,
    class: champion.class,
    race: champion.race,
    origin: champion.origin,
    role: champion.proposed.role,
    statsSource: tableRole ? 'role-table' : 'placeholder',
    stats: tableRole ? ROLE_STATS[tableRole] : PLACEHOLDER_STATS,
    basicAttack: FIXTURE_BASIC_ATTACK,
    proposed: champion.proposed,
  };
}

/** The roster validation result for the bundled roster file. */
export const ROSTER_VALIDATION: RosterValidation = validateRoster(rosterJson);

/** Playable versions of all 135 roster Champions, in roster order; empty if the roster is invalid. */
export const ROSTER_CHAMPIONS: readonly PlayableChampion[] = Object.freeze(
  ROSTER_VALIDATION.roster ? ROSTER_VALIDATION.roster.champions.map(playableChampion) : [],
);
