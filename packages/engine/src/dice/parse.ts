import { M1_CONFIG } from '../config';
import { rollDice } from '../rng/dice';
import type { Rng } from '../rng/rng';

/** A parsed `NdM`, `NdM+K` or `NdM-K` expression (ability-authoring-guide section 3). */
export interface DiceExpression {
  /** N: number of dice, at least 1. */
  readonly count: number;
  /** M: faces per die, at least 1. */
  readonly sides: number;
  /** +K or -K; 0 when absent. */
  readonly modifier: number;
}

export type DiceParseResult =
  | { readonly ok: true; readonly value: DiceExpression }
  | { readonly ok: false; readonly error: string };

// No leading zeros, no whitespace, lowercase `d` only. Arbitrary expressions are not permitted.
const DICE_PATTERN = /^([1-9][0-9]*)d([1-9][0-9]*)(?:([+-])(0|[1-9][0-9]*))?$/;

export function parseDiceExpression(text: string): DiceParseResult {
  const match = DICE_PATTERN.exec(text);
  if (match === null) {
    return { ok: false, error: `invalid dice expression ${JSON.stringify(text)}; expected NdM, NdM+K or NdM-K` };
  }
  const [, countText, sidesText, sign, modifierText] = match;
  const count = Number(countText);
  const sides = Number(sidesText);
  const magnitude = modifierText === undefined ? 0 : Number(modifierText);

  if (count > M1_CONFIG.maxDiceCount) {
    return { ok: false, error: `dice count ${countText} exceeds ${M1_CONFIG.maxDiceCount}` };
  }
  if (sides > M1_CONFIG.maxDieSides) {
    return { ok: false, error: `die sides ${sidesText} exceed ${M1_CONFIG.maxDieSides}` };
  }
  if (magnitude > M1_CONFIG.maxDiceModifier) {
    return { ok: false, error: `modifier ${modifierText} exceeds ${M1_CONFIG.maxDiceModifier}` };
  }
  const modifier = sign === '-' && magnitude !== 0 ? -magnitude : magnitude;
  return { ok: true, value: { count, sides, modifier } };
}

export interface DiceRoll {
  /** Each die's face, in rolling order. */
  readonly dice: readonly number[];
  /** Sum of the dice plus the modifier. This is P-005's "dice roll" (see damage.ts). */
  readonly total: number;
}

/** Rolls a parsed expression: `count` dice in order (ruleset section 9.2), then adds the modifier. */
export function rollDiceExpression(rng: Rng, expression: DiceExpression): DiceRoll {
  const dice = rollDice(rng, expression.count, expression.sides);
  const total = dice.reduce((sum, face) => sum + face, 0) + expression.modifier;
  return { dice, total };
}
