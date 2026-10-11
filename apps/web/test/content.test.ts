import { describe, expect, it } from 'vitest';
import { validateBattleInput } from '@dc/engine';
import { FIXTURE_BASIC_ATTACK as ENGINE_FIXTURE_ATTACK, ROLE_STATS as ENGINE_ROLE_STATS } from '../../../packages/engine/test/fixtures/roles';
import { EXPEDITION_CONFIG, FIXTURE_BASIC_ATTACK, PROTOTYPE_CONTENT, ROLE_STATS, contentProblems } from '../src/game/index';

describe('prototype fixture content (P-021)', () => {
  it('has no content problems', () => {
    expect(contentProblems(PROTOTYPE_CONTENT)).toEqual([]);
  });

  it('uses the same P-007 Role stats and P-015 Basic Attack as the engine test fixtures', () => {
    for (const [role, stats] of Object.entries(ENGINE_ROLE_STATS)) {
      expect(ROLE_STATS[role as keyof typeof ROLE_STATS]).toEqual({ ...stats, initiativeModifier: 0 });
    }
    expect(FIXTURE_BASIC_ATTACK).toEqual(ENGINE_FIXTURE_ATTACK);
  });

  it('every encounter forms a valid engine battle against the largest legal player team', () => {
    const players = PROTOTYPE_CONTENT.champions.slice(0, EXPEDITION_CONFIG.maxTeamSize).map((c, i) => ({
      id: `p${i}`,
      slot: i,
      stats: c.stats,
      basicAttack: c.basicAttack,
    }));
    for (const encounter of PROTOTYPE_CONTENT.encounters) {
      const monsters = encounter.monsters.map((m, i) => ({ id: `m${i}`, slot: m.slot, stats: m.stats, basicAttack: m.basicAttack }));
      expect(validateBattleInput({ seed: 1, participants: [{ id: 'player', units: players }, { id: 'monsters', units: monsters }] })).toEqual([]);
    }
  });

  it('encounters grow from 1 to 3 monsters', () => {
    expect(PROTOTYPE_CONTENT.encounters.map((e) => e.monsters.length)).toEqual([1, 2, 3]);
  });
});
