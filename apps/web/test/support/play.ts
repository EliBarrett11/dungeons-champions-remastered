import { PROTOTYPE_CONTENT, createExpedition, transition } from '../../src/game/index';
import type { ExpeditionAction, ExpeditionContent, ExpeditionState } from '../../src/game/index';

/** Applies an action that must succeed; fails the test with the rejection message otherwise. */
export function act(state: ExpeditionState, action: ExpeditionAction, content: ExpeditionContent = PROTOTYPE_CONTENT): ExpeditionState {
  const result = transition(state, action, content);
  if (!result.ok) throw new Error(`${action.type} rejected: ${result.error} ${result.details.join('; ')}`);
  return result.state;
}

/** The team used across tests: bench Champions c1 (front 1), c2 (front 0) and c3 (back 8). */
export function placeStandardTeam(state: ExpeditionState): ExpeditionState {
  let next = act(state, { type: 'place', instanceId: 'c1', slot: 1 });
  next = act(next, { type: 'place', instanceId: 'c2', slot: 0 });
  return act(next, { type: 'place', instanceId: 'c3', slot: 8 });
}

/** Deep-frozen copy, so a test fails if a transition mutates its input state. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

/** A new Expedition with the prototype content (the roster draw needs the content). */
export function newExpedition(seed: number, content: ExpeditionContent = PROTOTYPE_CONTENT): ExpeditionState {
  return createExpedition(seed, content);
}
