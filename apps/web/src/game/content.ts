import { ROSTER_CHAMPIONS } from './champions';
import type { PlayableChampion } from './champions';
import { PROTOTYPE_ENCOUNTERS } from './fixtures';
import type { EncounterFixture } from './fixtures';

/** Everything an Expedition reads: the playable roster Champions and the fixture encounters. */
export interface ExpeditionContent {
  readonly champions: readonly PlayableChampion[];
  readonly encounters: readonly EncounterFixture[];
}

/** The prototype content: all 135 roster Champions (D-021) and the three fixture Monster Rounds. */
export const PROTOTYPE_CONTENT: ExpeditionContent = Object.freeze({
  champions: ROSTER_CHAMPIONS,
  encounters: PROTOTYPE_ENCOUNTERS,
});
