import type { BasicAttackInput, UnitStats } from '@dc/engine';

/**
 * PROTOTYPE FIXTURE CONTENT (P-021, P-022). Not authoritative Monster content.
 *
 * - Stats are the docs/COMBAT/STAT_MODEL.md Role table at Rank 1, level 1 (P-007), which is a
 *   PROPOSED balance table used here as fixture data only. Spell Power and Magic Resistance are
 *   unused by the M1 engine and omitted. Initiative Modifier is +0 (I-7, fixtures only).
 * - Every unit uses the shared P-015 fixture Basic Attack. No Passive, Ultimate, Trait, Item or
 *   Feat is implemented, and none is shown as if it were.
 * - Monster teams reuse Role-table stats; the real Monster roster is UNRESOLVED.
 * - Since M3 the player's Champions come from the approved roster (champions.ts), which reuses
 *   these Role-table stats as temporary combat numbers. Item Components are not implemented.
 */

export type FixtureRole =
  | 'tank' | 'bruiser' | 'assassin' | 'skirmisher' | 'marksman'
  | 'artillery' | 'mage' | 'controller' | 'support';

/** P-015 shared fixture Basic Attack: 1d8, Attack x 1.0, physical. */
export const FIXTURE_BASIC_ATTACK: BasicAttackInput = Object.freeze({
  dice: '1d8',
  scalingStat: 'attack',
  scalingRatioBp: 10_000,
  damageType: 'physical',
});

/** P-007 Role table, Rank 1, level 1 (attack speed in thousandths, I-9). */
export const ROLE_STATS: Readonly<Record<FixtureRole, UnitStats>> = Object.freeze({
  tank: { health: 900, attack: 35, armor: 60, accuracy: 1, evasion: 1, attackSpeedMilli: 650, initiativeModifier: 0 },
  bruiser: { health: 760, attack: 65, armor: 40, accuracy: 2, evasion: 2, attackSpeedMilli: 800, initiativeModifier: 0 },
  assassin: { health: 520, attack: 75, armor: 15, accuracy: 3, evasion: 5, attackSpeedMilli: 1000, initiativeModifier: 0 },
  skirmisher: { health: 620, attack: 50, armor: 25, accuracy: 2, evasion: 6, attackSpeedMilli: 1100, initiativeModifier: 0 },
  marksman: { health: 500, attack: 70, armor: 15, accuracy: 5, evasion: 2, attackSpeedMilli: 1000, initiativeModifier: 0 },
  artillery: { health: 480, attack: 90, armor: 10, accuracy: 3, evasion: 1, attackSpeedMilli: 650, initiativeModifier: 0 },
  mage: { health: 500, attack: 25, armor: 10, accuracy: 2, evasion: 2, attackSpeedMilli: 750, initiativeModifier: 0 },
  controller: { health: 560, attack: 30, armor: 20, accuracy: 3, evasion: 3, attackSpeedMilli: 750, initiativeModifier: 0 },
  support: { health: 620, attack: 25, armor: 25, accuracy: 2, evasion: 2, attackSpeedMilli: 750, initiativeModifier: 0 },
});

export interface MonsterFixture {
  readonly name: string;
  readonly role: FixtureRole;
  readonly slot: number;
  readonly stats: UnitStats;
  readonly basicAttack: BasicAttackInput;
}

/**
 * P-019 reward bundle template. `championCount` roster Champions are drawn for the bundle by seed
 * when the Expedition starts (P-022); the resulting offer is stored in the Expedition state.
 */
export interface RewardBundle {
  readonly id: string;
  readonly gold: number;
  readonly championCount: number;
}

export interface EncounterFixture {
  readonly id: string;
  readonly name: string;
  readonly monsters: readonly MonsterFixture[];
  /** P-019: exactly three bundles; the player picks one after a victory. */
  readonly rewards: readonly RewardBundle[];
}

function monster(role: FixtureRole, name: string, slot: number): MonsterFixture {
  return { name, role, slot, stats: ROLE_STATS[role], basicAttack: FIXTURE_BASIC_ATTACK };
}

/**
 * Encounter strength rises 1 -> 2 -> 3 monsters (P-018, unchanged from M2). Monsters remain
 * fixtures: the roster contains Champions only, and the Monster roster is UNRESOLVED.
 * Reward values are PROVISIONAL (P-019); the Champions offered come from the roster (P-022).
 */
export const PROTOTYPE_ENCOUNTERS: readonly EncounterFixture[] = Object.freeze([
  {
    id: 'encounter-1',
    name: 'Monster Round 1',
    monsters: [monster('skirmisher', 'Monster (Skirmisher stats)', 1)],
    rewards: [
      { id: 'e1-champion-a', gold: 1, championCount: 1 },
      { id: 'e1-champion-b', gold: 1, championCount: 1 },
      { id: 'e1-gold', gold: 3, championCount: 0 },
    ],
  },
  {
    id: 'encounter-2',
    name: 'Monster Round 2',
    monsters: [
      monster('skirmisher', 'Monster (Skirmisher stats)', 1),
      monster('artillery', 'Monster (Artillery stats)', 8),
    ],
    rewards: [
      { id: 'e2-champion-a', gold: 1, championCount: 1 },
      { id: 'e2-champion-b', gold: 1, championCount: 1 },
      { id: 'e2-gold', gold: 3, championCount: 0 },
    ],
  },
  {
    id: 'encounter-3',
    name: 'Monster Round 3',
    monsters: [
      monster('skirmisher', 'Monster (Skirmisher stats)', 0),
      monster('bruiser', 'Monster (Bruiser stats)', 1),
      monster('artillery', 'Monster (Artillery stats)', 8),
    ],
    rewards: [
      { id: 'e3-champion-a', gold: 1, championCount: 1 },
      { id: 'e3-champion-b', gold: 1, championCount: 1 },
      { id: 'e3-gold', gold: 3, championCount: 0 },
    ],
  },
]);
