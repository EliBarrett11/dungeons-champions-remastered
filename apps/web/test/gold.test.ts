import { describe, expect, it } from 'vitest';
import {
  EXPEDITION_CONFIG,
  PROTOTYPE_CONTENT,
  PROTOTYPE_ENCOUNTERS,
  applyGoldChange,
  economyStateProblems,
  goldAccountProblems,
  startingGoldAccount,
  transition,
} from '../src/game/index';
import type { ExpeditionAction, ExpeditionState, GoldAccount } from '../src/game/index';
import { act, deepFreeze, newExpedition, placeStandardTeam } from './support/play';

/** M4 checkpoint B: starting Gold and single-path Gold accounting (P-025, P-026). */

/** Every step must reconcile: gold = 3 + earned - spent, spending 0 so far, never negative. */
function expectReconciled(state: ExpeditionState): void {
  expect(state.gold).toBe(EXPEDITION_CONFIG.startingGold + state.goldEarned - state.goldSpent);
  expect(state.goldSpent).toBe(0);
  expect(state.gold).toBeGreaterThanOrEqual(0);
  expect(economyStateProblems(state, PROTOTYPE_CONTENT)).toEqual([]);
}

function step(state: ExpeditionState, action: ExpeditionAction): ExpeditionState {
  const next = act(state, action);
  expectReconciled(next);
  return next;
}

describe('starting Gold (P-025)', () => {
  it('is exactly 3 for every new Expedition', () => {
    expect(EXPEDITION_CONFIG.startingGold).toBe(3);
    for (const seed of [0, 1, 24, 26, 99, 4294967295]) {
      const state = newExpedition(seed);
      expect([state.gold, state.goldEarned, state.goldSpent]).toEqual([3, 0, 0]);
      expectReconciled(state);
    }
    expect(startingGoldAccount()).toEqual({ gold: 3, goldEarned: 0, goldSpent: 0 });
  });

  it('resets to 3 when a new Expedition starts, after any amount was earned', () => {
    for (const ending of ['cleared', 'retreated', 'defeated'] as const) {
      let state = placeStandardTeam(newExpedition(ending === 'defeated' ? 1 : 24));
      const rounds = ending === 'retreated' ? 1 : 3;
      for (let round = 0; round < rounds; round += 1) {
        state = step(step(state, { type: 'startBattle' }), { type: 'finishBattle' });
        if (state.phase === 'ended') break;
        state = step(state, { type: 'chooseReward', bundleId: `e${round + 1}-gold` });
        if (state.phase === 'decision' && round + 1 < rounds) state = step(state, { type: 'continue' });
      }
      if (state.phase === 'decision') state = step(state, { type: 'endExpedition' });
      expect(state.phase).toBe('ended');
      expect(state.gold).toBeGreaterThan(3);
      const restarted = step(state, { type: 'newExpedition', seed: 5 });
      expect([restarted.gold, restarted.goldEarned, restarted.goldSpent]).toEqual([3, 0, 0]);
    }
  });
});

describe('Gold across rounds (P-026)', () => {
  it('carries across round transitions unchanged, and every step reconciles', () => {
    let state = placeStandardTeam(newExpedition(24));
    expectReconciled(state);
    const goldBefore: number[] = [];
    for (const [index, bundle] of ['e1-gold', 'e2-champion-a', 'e3-champion-b'].entries()) {
      goldBefore.push(state.gold);
      state = step(step(state, { type: 'startBattle' }), { type: 'finishBattle' });
      expect(state.gold).toBe(goldBefore[index]); // a battle never changes Gold
      state = step(state, { type: 'chooseReward', bundleId: bundle });
      if (state.phase === 'decision') {
        const atDecision = state.gold;
        state = step(state, { type: 'continue' });
        expect(state.gold).toBe(atDecision); // carried into the next round
      }
    }
    expect(goldBefore).toEqual([3, 6, 7]);
    expect([state.phase, state.gold, state.goldEarned, state.goldSpent]).toEqual(['ended', 8, 5, 0]);
  });

  it('a defeat or draw adds no Gold; ending early adds no Gold', () => {
    let defeat = placeStandardTeam(newExpedition(1));
    for (const bundle of ['e1-gold', 'e2-gold']) {
      defeat = step(step(step(defeat, { type: 'startBattle' }), { type: 'finishBattle' }), { type: 'chooseReward', bundleId: bundle });
      defeat = step(defeat, { type: 'continue' });
    }
    const beforeLoss = defeat.gold;
    defeat = step(step(defeat, { type: 'startBattle' }), { type: 'finishBattle' });
    expect([defeat.endReason, defeat.gold]).toEqual(['defeated', beforeLoss]);

    let draw = step(step(step(placeStandardTeam(newExpedition(26)), { type: 'startBattle' }), { type: 'finishBattle' }), { type: 'chooseReward', bundleId: 'e1-gold' });
    draw = step(draw, { type: 'continue' });
    draw = step(step(draw, { type: 'startBattle' }), { type: 'finishBattle' });
    expect([draw.endReason, draw.gold]).toEqual(['draw', 6]);

    let early = step(step(step(placeStandardTeam(newExpedition(24)), { type: 'startBattle' }), { type: 'finishBattle' }), { type: 'chooseReward', bundleId: 'e1-champion-b' });
    const atDecision = early.gold;
    early = step(early, { type: 'endExpedition' });
    expect([early.endReason, early.gold]).toEqual(['retreated', atDecision]);
  });
});

describe('reward claims', () => {
  it('each reward can be claimed only once; a second claim changes nothing', () => {
    const won = step(step(placeStandardTeam(newExpedition(24)), { type: 'startBattle' }), { type: 'finishBattle' });
    const claimed = deepFreeze(step(won, { type: 'chooseReward', bundleId: 'e1-gold' }));
    expect([claimed.gold, claimed.goldEarned]).toEqual([6, 3]);
    for (const bundleId of ['e1-gold', 'e1-champion-a', 'e1-champion-b']) {
      const again = transition(claimed, { type: 'chooseReward', bundleId }, PROTOTYPE_CONTENT);
      expect(again.ok).toBe(false);
      expect(again.state).toBe(claimed);
    }
  });

  it('the reward bundles and their values are unchanged (P-019, P-026)', () => {
    expect(PROTOTYPE_ENCOUNTERS.map((e) => e.rewards.map((b) => [b.id, b.gold, b.championCount]))).toEqual([
      [['e1-champion-a', 1, 1], ['e1-champion-b', 1, 1], ['e1-gold', 3, 0]],
      [['e2-champion-a', 1, 1], ['e2-champion-b', 1, 1], ['e2-gold', 3, 0]],
      [['e3-champion-a', 1, 1], ['e3-champion-b', 1, 1], ['e3-gold', 3, 0]],
    ]);
    for (const [bundle, gold] of [['e1-gold', 3], ['e1-champion-a', 1], ['e1-champion-b', 1]] as const) {
      const won = act(act(placeStandardTeam(newExpedition(24)), { type: 'startBattle' }), { type: 'finishBattle' });
      expect(act(won, { type: 'chooseReward', bundleId: bundle }).gold - won.gold).toBe(gold);
    }
  });
});

describe('applyGoldChange (the single Gold path)', () => {
  const account: GoldAccount = deepFreeze({ gold: 3, goldEarned: 0, goldSpent: 0 });

  it('adds income and records it as earned', () => {
    expect(applyGoldChange(account, { kind: 'reward', amount: 3 })).toEqual({ ok: true, account: { gold: 6, goldEarned: 3, goldSpent: 0 } });
    expect(applyGoldChange(account, { kind: 'reward', amount: 0 })).toEqual({ ok: true, account });
  });

  it('subtracts spending and records it (prepared for purchases and rerolls)', () => {
    expect(applyGoldChange(account, { kind: 'purchase', amount: 2 })).toEqual({ ok: true, account: { gold: 1, goldEarned: 0, goldSpent: 2 } });
    expect(applyGoldChange(account, { kind: 'reroll', amount: 3 })).toEqual({ ok: true, account: { gold: 0, goldEarned: 0, goldSpent: 3 } });
  });

  it('refuses spending more than is held, and invalid amounts, without changing the account', () => {
    expect(applyGoldChange(account, { kind: 'purchase', amount: 4 })).toEqual({ ok: false, error: 'Not enough Gold: 4 needed, 3 available.' });
    expect(applyGoldChange(account, { kind: 'reroll', amount: -1 })).toEqual({ ok: false, error: 'A Gold reroll must be a whole number, 0 or more (got -1).' });
    expect(applyGoldChange(account, { kind: 'reward', amount: 1.5 })).toEqual({ ok: false, error: 'A Gold reward must be a whole number, 0 or more (got 1.5).' });
    expect(account).toEqual({ gold: 3, goldEarned: 0, goldSpent: 0 });
  });

  it('keeps any sequence of changes reconciled and never negative', () => {
    // Deterministic pseudo-random sequence of 2,000 changes.
    let x = 12345;
    const next = () => (x = (x * 1103515245 + 12345) % 2 ** 31);
    let current: GoldAccount = startingGoldAccount();
    for (let i = 0; i < 2000; i += 1) {
      const kinds = ['reward', 'purchase', 'reroll'] as const;
      const result = applyGoldChange(current, { kind: kinds[next() % 3]!, amount: next() % 6 });
      if (result.ok) current = result.account;
      expect(current.gold).toBeGreaterThanOrEqual(0);
      expect(goldAccountProblems(current)).toEqual([]);
    }
    expect(current.goldEarned).toBeGreaterThan(0);
    expect(current.goldSpent).toBeGreaterThan(0);
  });

  it('goldAccountProblems detects an account that does not reconcile', () => {
    expect(goldAccountProblems({ gold: 5, goldEarned: 1, goldSpent: 0 })).toEqual([
      'Gold does not reconcile: 5 held, but 3 starting + 1 earned - 0 spent = 4.',
    ]);
    expect(goldAccountProblems({ gold: 3, goldEarned: -1, goldSpent: -1 })).toEqual([
      'Gold earned must be a whole number, 0 or more (got -1).',
      'Gold spent must be a whole number, 0 or more (got -1).',
    ]);
  });
});

describe('single Gold path (source scan)', () => {
  const sources = import.meta.glob<string>('../src/**/*.ts', { eager: true, query: '?raw', import: 'default' });

  it('no source file outside gold.ts does arithmetic on Gold or assigns Gold fields', () => {
    const goldArithmetic = /\b(gold|goldEarned|goldSpent)\s*(:|=|\+=|-=)\s*[^,;\n}]*[+-]\s*[\w(]|\.(gold|goldEarned|goldSpent)\s*(\+|-)\s*[\w(]/;
    const offenders = Object.entries(sources)
      .filter(([path]) => !path.endsWith('/game/gold.ts'))
      .filter(([, source]) => goldArithmetic.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
    expect(goldArithmetic.test('gold: state.gold + bundle.gold,')).toBe(true); // the pre-B pattern is caught
    expect(goldArithmetic.test(sources['../src/game/gold.ts']!)).toBe(true); // gold.ts itself does the arithmetic
  });
});
