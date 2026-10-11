import type { BasicAttackInput, BattleInput, UnitInput, UnitStats } from '../../src/index';

/**
 * Test fixtures only (P-007, P-015). Role table from docs/COMBAT/STAT_MODEL.md at Rank 1, level 1.
 * Spell Power and Magic Resistance are unused in M1 and omitted. Attack speed is in thousandths.
 */
export type Role =
  | 'tank' | 'bruiser' | 'assassin' | 'skirmisher' | 'marksman'
  | 'artillery' | 'mage' | 'controller' | 'support';

type RoleStats = Omit<UnitStats, 'initiativeModifier'>;

export const ROLE_STATS: Readonly<Record<Role, RoleStats>> = {
  tank: { health: 900, attack: 35, armor: 60, accuracy: 1, evasion: 1, attackSpeedMilli: 650 },
  bruiser: { health: 760, attack: 65, armor: 40, accuracy: 2, evasion: 2, attackSpeedMilli: 800 },
  assassin: { health: 520, attack: 75, armor: 15, accuracy: 3, evasion: 5, attackSpeedMilli: 1000 },
  skirmisher: { health: 620, attack: 50, armor: 25, accuracy: 2, evasion: 6, attackSpeedMilli: 1100 },
  marksman: { health: 500, attack: 70, armor: 15, accuracy: 5, evasion: 2, attackSpeedMilli: 1000 },
  artillery: { health: 480, attack: 90, armor: 10, accuracy: 3, evasion: 1, attackSpeedMilli: 650 },
  mage: { health: 500, attack: 25, armor: 10, accuracy: 2, evasion: 2, attackSpeedMilli: 750 },
  controller: { health: 560, attack: 30, armor: 20, accuracy: 3, evasion: 3, attackSpeedMilli: 750 },
  support: { health: 620, attack: 25, armor: 25, accuracy: 2, evasion: 2, attackSpeedMilli: 750 },
};

/** P-015 shared fixture Basic Attack: 1d8, flat bonus 0, Attack x 1.0, physical. */
export const FIXTURE_BASIC_ATTACK: BasicAttackInput = {
  dice: '1d8',
  scalingStat: 'attack',
  scalingRatioBp: 10_000,
  damageType: 'physical',
};

/** Builds a test unit. I-7: a missing Initiative Modifier defaults to +0 (fixtures only). */
export function roleUnit(id: string, role: Role, slot: number, initiativeModifier?: number): UnitInput {
  return {
    id,
    slot,
    stats: { ...ROLE_STATS[role], initiativeModifier: initiativeModifier ?? 0 },
    basicAttack: FIXTURE_BASIC_ATTACK,
  };
}

/** A valid one-versus-one battle input. */
export function duel(seed = 12345): BattleInput {
  return {
    seed,
    participants: [
      { id: 'p0', units: [roleUnit('p0-tank', 'tank', 0)] },
      { id: 'p1', units: [roleUnit('p1-marksman', 'marksman', 7)] },
    ],
  };
}
