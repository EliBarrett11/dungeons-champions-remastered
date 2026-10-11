import { EXPEDITION_CONFIG } from './config';

/**
 * Gold accounting (M4 checkpoint B; P-025, P-026). Every change to an Expedition's Gold goes
 * through `applyGoldChange`, which keeps the account reconcilable at all times:
 *
 *   gold = starting Gold + goldEarned - goldSpent,  and gold is never negative.
 *
 * Income today is only the victory reward (P-026: no base income, interest or streak bonuses).
 * 'purchase' and 'reroll' are the spending kinds the shop will use (checkpoint D); nothing spends
 * Gold yet.
 */

export type GoldIncome = 'reward';
export type GoldSpending = 'purchase' | 'reroll';

export interface GoldChange {
  readonly kind: GoldIncome | GoldSpending;
  /** Whole number of Gold, 0 or more; the kind decides whether it is added or spent. */
  readonly amount: number;
}

export interface GoldAccount {
  readonly gold: number;
  /** Total Gold received this Expedition (rewards). */
  readonly goldEarned: number;
  /** Total Gold spent this Expedition (purchases and rerolls; 0 until checkpoint D). */
  readonly goldSpent: number;
}

export type GoldResult<T extends GoldAccount> =
  | { readonly ok: true; readonly account: T }
  | { readonly ok: false; readonly error: string };

const INCOME: ReadonlySet<GoldChange['kind']> = new Set<GoldChange['kind']>(['reward']);

/** The account every new Expedition starts with (P-025: 3 Gold). */
export function startingGoldAccount(): GoldAccount {
  return { gold: EXPEDITION_CONFIG.startingGold, goldEarned: 0, goldSpent: 0 };
}

/** Applies one Gold change. Rejections return an error and never change the account. */
export function applyGoldChange<T extends GoldAccount>(account: T, change: GoldChange): GoldResult<T> {
  if (!Number.isSafeInteger(change.amount) || change.amount < 0) {
    return { ok: false, error: `A Gold ${change.kind} must be a whole number, 0 or more (got ${change.amount}).` };
  }
  if (INCOME.has(change.kind)) {
    return { ok: true, account: { ...account, gold: account.gold + change.amount, goldEarned: account.goldEarned + change.amount } };
  }
  if (change.amount > account.gold) {
    return { ok: false, error: `Not enough Gold: ${change.amount} needed, ${account.gold} available.` };
  }
  return { ok: true, account: { ...account, gold: account.gold - change.amount, goldSpent: account.goldSpent + change.amount } };
}

/** Problems with an account's reconciliation; empty when consistent. */
export function goldAccountProblems(account: GoldAccount, startingGold: number = EXPEDITION_CONFIG.startingGold): string[] {
  const problems: string[] = [];
  for (const [name, value] of [['Gold', account.gold], ['Gold earned', account.goldEarned], ['Gold spent', account.goldSpent]] as const) {
    if (!Number.isSafeInteger(value) || value < 0) problems.push(`${name} must be a whole number, 0 or more (got ${value}).`);
  }
  if (account.gold !== startingGold + account.goldEarned - account.goldSpent) {
    problems.push(
      `Gold does not reconcile: ${account.gold} held, but ${startingGold} starting + ${account.goldEarned} earned - ${account.goldSpent} spent = ${startingGold + account.goldEarned - account.goldSpent}.`,
    );
  }
  return problems;
}
