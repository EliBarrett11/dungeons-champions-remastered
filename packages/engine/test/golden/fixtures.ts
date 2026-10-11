import type { BattleInput, BattleOutcome } from '../../src/index';
import { duel, roleUnit } from '../fixtures/roles';

/**
 * Golden replay fixtures (M1 acceptance 2, plan section 7). Each log file holds the canonical event
 * log, one event per line, and was checked by hand before its hash was recorded. The hash is the
 * SHA-256 of serializeEvents(events), and was also confirmed with the system `sha256sum` tool.
 * Changing the random-number order, a rule or the event format changes these on purpose.
 */
export interface GoldenFixture {
  readonly name: string;
  readonly input: BattleInput;
  readonly expected: {
    readonly sha256: string;
    readonly outcome: BattleOutcome;
    readonly endTimeMs: number;
    readonly eventCount: number;
  };
}

/**
 * Expected results, recorded only after (1) each log was replayed event-for-event by an independent
 * Python implementation of the ruleset seeded by the PractRand-derived C reference, and (2) each
 * hash was confirmed with the system `sha256sum` and Python's hashlib.
 */
export const GOLDEN_EXPECTED: Readonly<Record<string, GoldenFixture['expected']>> = {
  'duel-12345': {
    sha256: '8f6b33055d664abc9c45f8cd9e0b23ab516a6eafb071e4ae394fd2433634685b',
    outcome: { kind: 'win', winner: 'p1', winnerSide: 'B' },
    endTimeMs: 29_000,
    eventCount: 101,
  },
  'three-v-three-2024': {
    sha256: '00d6ee0205c8a55aef764c8e037423c2590b1e61372ddbcd7d859c06adb88151',
    outcome: { kind: 'win', winner: 'p1', winnerSide: 'B' },
    endTimeMs: 31_000,
    eventCount: 258,
  },
  'five-v-five-max-seed': {
    sha256: '1a08c31500d0bf462c588bd50db4a72fbcd0e31be81906dc58d2430f37f67c94',
    outcome: { kind: 'win', winner: 'left', winnerSide: 'B' },
    endTimeMs: 28_179,
    eventCount: 361,
  },
};

export const GOLDEN_INPUTS: Readonly<Record<string, BattleInput>> = {
  'duel-12345': duel(12345),
  'three-v-three-2024': {
    seed: 2024,
    participants: [
      { id: 'p0', units: [roleUnit('p0-tank', 'tank', 0, 2), roleUnit('p0-bruiser', 'bruiser', 1, -1), roleUnit('p0-mage', 'mage', 7)] },
      { id: 'p1', units: [roleUnit('p1-assassin', 'assassin', 2, 3), roleUnit('p1-marksman', 'marksman', 8), roleUnit('p1-support', 'support', 4, -2)] },
    ],
  },
  'five-v-five-max-seed': {
    seed: 4294967295,
    participants: [
      {
        id: 'left',
        units: [
          roleUnit('l-tank', 'tank', 0, 1), roleUnit('l-bruiser', 'bruiser', 2), roleUnit('l-skirmisher', 'skirmisher', 4, 2),
          roleUnit('l-artillery', 'artillery', 8, -1), roleUnit('l-controller', 'controller', 10),
        ],
      },
      {
        id: 'right',
        units: [
          roleUnit('r-bruiser', 'bruiser', 1, 1), roleUnit('r-assassin', 'assassin', 3, 5), roleUnit('r-marksman', 'marksman', 7),
          roleUnit('r-mage', 'mage', 9, -2), roleUnit('r-support', 'support', 11),
        ],
      },
    ],
  },
};
