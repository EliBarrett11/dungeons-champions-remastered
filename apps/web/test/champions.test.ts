import { describe, expect, it } from 'vitest';
import { encounterSeed as seedFor, EXPEDITION_CONFIG } from '../src/game/index';
import {
  FIXTURE_BASIC_ATTACK,
  PLACEHOLDER_STATS,
  PROTOTYPE_CONTENT,
  ROLE_STATS,
  ROSTER_CHAMPIONS,
  championsNeeded,
  drawRosterChampions,
  encounterSeed,
} from '../src/game/index';
import rosterJson from '../../../content/roster/champions.json';
import { newExpedition } from './support/play';

describe('playable roster Champions (P-022)', () => {
  it('turns all 135 roster Champions into playable Champions, keeping identity, traits and Role', () => {
    expect(ROSTER_CHAMPIONS).toHaveLength(135);
    ROSTER_CHAMPIONS.forEach((champion, index) => {
      const source = rosterJson.champions[index]!;
      expect([champion.id, champion.name, champion.class, champion.race, champion.origin, champion.role]).toEqual([
        source.id, source.name, source.class, source.race, source.origin, source.proposed.role,
      ]);
      expect(champion.basicAttack).toEqual(FIXTURE_BASIC_ATTACK);
    });
    expect(PROTOTYPE_CONTENT.champions).toBe(ROSTER_CHAMPIONS);
  });

  it('uses Role-table stats where the Role has a row, and the placeholder only for Fighter and Ranger', () => {
    const byRole = new Map<string, Set<string>>();
    for (const champion of ROSTER_CHAMPIONS) {
      byRole.set(champion.role, (byRole.get(champion.role) ?? new Set()).add(champion.statsSource));
      if (champion.statsSource === 'role-table') {
        expect(champion.stats).toEqual(ROLE_STATS[champion.role.toLowerCase() as keyof typeof ROLE_STATS]);
      } else {
        expect(champion.stats).toBe(PLACEHOLDER_STATS);
      }
    }
    expect(Object.fromEntries([...byRole].map(([role, sources]) => [role, [...sources]]))).toEqual({
      Assassin: ['role-table'], Bruiser: ['role-table'], Controller: ['role-table'], Fighter: ['placeholder'],
      Mage: ['role-table'], Ranger: ['placeholder'], Support: ['role-table'], Tank: ['role-table'],
    });
    expect(ROSTER_CHAMPIONS.filter((c) => c.statsSource === 'placeholder')).toHaveLength(22);
  });

  it('derives the placeholder from the Role table (rounded mean), adding no new balance numbers', () => {
    expect(PLACEHOLDER_STATS).toEqual({
      health: 607, attack: 52, armor: 24, accuracy: 3, evasion: 3, attackSpeedMilli: 828, initiativeModifier: 0,
    });
  });
});

describe('seeded roster draw (P-022)', () => {
  it('draws 4 bench Champions plus 6 offered Champions, all different and all from the roster', () => {
    expect(championsNeeded(PROTOTYPE_CONTENT)).toBe(10);
    const drawn = drawRosterChampions(24, PROTOTYPE_CONTENT);
    expect(new Set(drawn).size).toBe(10);
    for (const id of drawn) expect(rosterJson.champions.some((c) => c.id === id)).toBe(true);
    const state = newExpedition(24);
    expect(state.bench.map((b) => b.championId)).toEqual(drawn.slice(0, 4));
    expect(state.offers.flat().flatMap((o) => o.champions)).toEqual(drawn.slice(4));
    expect(state.offers.map((offers) => offers.map((o) => [o.id, o.gold, o.champions.length]))).toEqual([
      [['e1-champion-a', 1, 1], ['e1-champion-b', 1, 1], ['e1-gold', 3, 0]],
      [['e2-champion-a', 1, 1], ['e2-champion-b', 1, 1], ['e2-gold', 3, 0]],
      [['e3-champion-a', 1, 1], ['e3-champion-b', 1, 1], ['e3-gold', 3, 0]],
    ]);
  });

  it('is deterministic for a seed and differs between seeds', () => {
    expect(newExpedition(99)).toEqual(newExpedition(99));
    const benches = new Set([1, 2, 3, 4, 5].map((seed) => drawRosterChampions(seed, PROTOTYPE_CONTENT).join(',')));
    expect(benches.size).toBe(5);
  });

  it('uses its own generator stream, so battle seeds are unchanged by the draw', () => {
    // The draw is seeded with the output after the three battle seeds (P-009 derivation unchanged).
    expect(seedFor).toBe(encounterSeed);
    const seeds = [0, 1, 2].map((i) => encounterSeed(24, i));
    const drawSeed = encounterSeed(24, EXPEDITION_CONFIG.encounterCount);
    expect(seeds).not.toContain(drawSeed);
  });

  it('can reach every roster Champion over many seeds (no Champion is excluded by the method)', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 400 && seen.size < 135; seed += 1) for (const id of drawRosterChampions(seed, PROTOTYPE_CONTENT)) seen.add(id);
    expect(seen.size).toBe(135);
  });
});
