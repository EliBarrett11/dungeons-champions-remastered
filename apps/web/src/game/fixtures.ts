import type { BasicAttackInput, UnitStats } from '@dc/engine';

/**
 * PROTOTYPE FIXTURE CONTENT (P-021). Not authoritative roster or monster content.
 *
 * - Stats are the docs/COMBAT/STAT_MODEL.md Role table at Rank 1, level 1 (P-007), which is a
 *   PROPOSED balance table used here as fixture data only. Spell Power and Magic Resistance are
 *   unused by the M1 engine and omitted. Initiative Modifier is +0 (I-7, fixtures only).
 * - Every unit uses the shared P-015 fixture Basic Attack. No Passive, Ultimate, Trait, Item or
 *   Feat is implemented, and none is shown as if it were.
 * - Monster teams reuse Role-table stats; the real Monster roster is UNRESOLVED.
 * - Reward bundles hold Gold and fixture Champions only; Item Components are not implemented.
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

export interface ChampionFixture {
  readonly id: string;
  readonly name: string;
  readonly role: FixtureRole;
  readonly stats: UnitStats;
  readonly basicAttack: BasicAttackInput;
}

export interface MonsterFixture {
  readonly name: string;
  readonly role: FixtureRole;
  readonly slot: number;
  readonly stats: UnitStats;
  readonly basicAttack: BasicAttackInput;
}

export interface RewardBundle {
  readonly id: string;
  readonly gold: number;
  /** Fixture Champion ids added to the bench; may be empty. */
  readonly champions: readonly string[];
}

export interface EncounterFixture {
  readonly id: string;
  readonly name: string;
  readonly monsters: readonly MonsterFixture[];
  /** P-019: exactly three bundles; the player picks one after a victory. */
  readonly rewards: readonly RewardBundle[];
}

export interface ExpeditionContent {
  readonly champions: readonly ChampionFixture[];
  readonly encounters: readonly EncounterFixture[];
}

function champion(role: FixtureRole, name: string): ChampionFixture {
  return { id: role, name, role, stats: ROLE_STATS[role], basicAttack: FIXTURE_BASIC_ATTACK };
}

function monster(role: FixtureRole, name: string, slot: number): MonsterFixture {
  return { name, role, slot, stats: ROLE_STATS[role], basicAttack: FIXTURE_BASIC_ATTACK };
}

/**
 * Encounter strength rises 1 -> 2 -> 3 monsters. With the starting bench, a three-Champion
 * front-line team wins Encounters 1 and 2 almost always and Encounter 3 roughly two times in three
 * (300-seed simulation, 2026-10-11); weak compositions lose. Values are PROVISIONAL (P-018, P-019).
 */
export const PROTOTYPE_CONTENT: ExpeditionContent = Object.freeze({
  champions: Object.freeze([
    champion('tank', 'Tank'),
    champion('bruiser', 'Bruiser'),
    champion('marksman', 'Marksman'),
    champion('support', 'Support'),
    champion('assassin', 'Assassin'),
    champion('skirmisher', 'Skirmisher'),
    champion('artillery', 'Artillery'),
  ]),
  encounters: Object.freeze([
    {
      id: 'encounter-1',
      name: 'Monster Round 1',
      monsters: [monster('skirmisher', 'Monster (Skirmisher stats)', 1)],
      rewards: [
        { id: 'e1-assassin', gold: 1, champions: ['assassin'] },
        { id: 'e1-skirmisher', gold: 1, champions: ['skirmisher'] },
        { id: 'e1-gold', gold: 3, champions: [] },
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
        { id: 'e2-artillery', gold: 1, champions: ['artillery'] },
        { id: 'e2-bruiser', gold: 1, champions: ['bruiser'] },
        { id: 'e2-gold', gold: 3, champions: [] },
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
        { id: 'e3-tank', gold: 1, champions: ['tank'] },
        { id: 'e3-marksman', gold: 1, champions: ['marksman'] },
        { id: 'e3-gold', gold: 3, champions: [] },
      ],
    },
  ]),
});
