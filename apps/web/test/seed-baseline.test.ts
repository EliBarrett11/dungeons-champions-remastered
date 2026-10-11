import { describe, expect, it } from 'vitest';
import { serializeEvents } from '@dc/engine';
import { encounterSeed } from '../src/game/index';
import { sha256Hex } from '../../../packages/engine/test/support/sha256';
import { act, newExpedition, placeStandardTeam } from './support/play';

/**
 * M4 regression baseline (P-029 acceptance condition). Recorded on 2026-10-11 from `main` at
 * 22ad061, before any M4 code: battle seeds, the starting bench, the reserved reward draws, and the
 * SHA-256 of the round-1 battle log (standard team c1/slot 1, c2/slot 0, c3/slot 8). The economy
 * must never change any of these for an existing seed.
 */
const BASELINE: Record<number, { battleSeeds: number[]; bench: string[]; rewards: (string | null)[][]; round1LogSha256: string }> = {
  0: {
    battleSeeds: [1363572419, 145230303, 808754475],
    bench: ['DC-051', 'DC-011', 'DC-049', 'DC-102'],
    rewards: [['DC-045', 'DC-037', null], ['DC-028', 'DC-055', null], ['DC-103', 'DC-053', null]],
    round1LogSha256: '94a1d5def5702799799a01097981290caedbb17af4b0a169b9479e716cbceb26',
  },
  1: {
    battleSeeds: [2012149540, 1872316204, 1707632675],
    bench: ['DC-075', 'DC-030', 'DC-064', 'DC-090'],
    rewards: [['DC-036', 'DC-073', null], ['DC-101', 'DC-092', null], ['DC-083', 'DC-085', null]],
    round1LogSha256: 'c2773dc1b5b34b11902bc64b1e72a3cd1dc5789e8e9bac044f1f28b8690390e8',
  },
  24: {
    battleSeeds: [3296717238, 2726755492, 2171716008],
    bench: ['DC-052', 'DC-117', 'DC-126', 'DC-095'],
    rewards: [['DC-068', 'DC-019', null], ['DC-048', 'DC-075', null], ['DC-133', 'DC-101', null]],
    round1LogSha256: '491f665d2c03371123bd88eda555e2f406c3fee0a94163f2df3a270790edf886',
  },
  26: {
    battleSeeds: [125239701, 583344825, 196944211],
    bench: ['DC-033', 'DC-001', 'DC-115', 'DC-133'],
    rewards: [['DC-110', 'DC-130', null], ['DC-081', 'DC-063', null], ['DC-068', 'DC-116', null]],
    round1LogSha256: '3b98dae0d982b377b8ba5577d970a92d3d5f4fa3d3b695ef54878cdda1ba7506',
  },
  4294967295: {
    battleSeeds: [1984736529, 3747275468, 1287205723],
    bench: ['DC-073', 'DC-013', 'DC-058', 'DC-068'],
    rewards: [['DC-083', 'DC-027', null], ['DC-082', 'DC-119', null], ['DC-080', 'DC-037', null]],
    round1LogSha256: '497346bb804ac56f11cff430dd6afa6e06bf011cce763666a9c646e0e801fe42',
  },
};

describe('pre-M4 seed baseline is unchanged (P-029)', () => {
  it.each(Object.keys(BASELINE).map(Number))('seed %i: battle seeds, bench, reward draws and round-1 log', (seed) => {
    const expected = BASELINE[seed]!;
    const state = newExpedition(seed);
    expect([0, 1, 2].map((i) => encounterSeed(seed, i))).toEqual(expected.battleSeeds);
    expect(state.bench.map((b) => b.championId)).toEqual(expected.bench);
    expect(state.offers.map((o) => o.map((x) => x.champions[0] ?? null))).toEqual(expected.rewards);
    const started = act(placeStandardTeam(state), { type: 'startBattle' });
    expect(sha256Hex(serializeEvents(started.battle!.result.events))).toBe(expected.round1LogSha256);
  });
});
