export type NextMoment =
  | {
      readonly kind: 'moment';
      readonly t: number;
      /** An overtime boundary falls at t: emit overtimeStep before any commitment event. */
      readonly boundary: boolean;
      /** At least one non-defeated unit's timer expires at t. */
      readonly attacks: boolean;
    }
  | { readonly kind: 'hardStop'; readonly t: number };

/**
 * Picks the next moment to handle (M1 plan section 5, revised): the earlier of the next timer
 * expiry of a non-defeated unit and the next pending overtime boundary. If that moment is at or
 * after the hard stop, nothing more resolves and the battle stops at exactly the hard stop (I-4).
 * Pure: callers pass the timers of non-defeated units only, plus the pending boundaries.
 */
export function nextMoment(
  aliveTimersMs: readonly number[],
  pendingBoundariesMs: readonly number[],
  hardStopMs: number,
): NextMoment {
  const nextAttack = aliveTimersMs.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...aliveTimersMs);
  const nextBoundary = pendingBoundariesMs.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...pendingBoundariesMs);
  const t = Math.min(nextAttack, nextBoundary);
  if (t >= hardStopMs) {
    return { kind: 'hardStop', t: hardStopMs };
  }
  return { kind: 'moment', t, boundary: t === nextBoundary, attacks: t === nextAttack };
}
