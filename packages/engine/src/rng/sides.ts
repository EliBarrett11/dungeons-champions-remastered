import type { Rng } from './rng';

export interface SideAssignment {
  /** The first generator output of the battle (I-5). */
  readonly u: number;
  /** Index of the participant assigned to side A; the other participant is side B. */
  readonly sideAParticipant: 0 | 1;
  readonly sideBParticipant: 0 | 1;
}

/**
 * I-5: the first output u decides the sides. u even: participant 0 is side A.
 * u odd: participant 1 is side A. Must be the battle's first draw (ruleset section 9.2).
 */
export function drawSideAssignment(rng: Rng): SideAssignment {
  const u = rng.nextUint32();
  const sideAParticipant: 0 | 1 = u % 2 === 0 ? 0 : 1;
  return { u, sideAParticipant, sideBParticipant: sideAParticipant === 0 ? 1 : 0 };
}
