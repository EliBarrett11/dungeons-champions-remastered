import { M1_CONFIG, Sfc32, isUint32, runBattle, validateBattleInput } from '@dc/engine';
import type { BattleInput, BattleResult, UnitInput } from '@dc/engine';
import { EXPEDITION_CONFIG } from './config';
import type { ChampionFixture, EncounterFixture, ExpeditionContent, RewardBundle } from './fixtures';
import { formationProblems, isLegalSlot } from './formation';
import type { Placement } from './formation';

/**
 * The M2 prototype Expedition (P-018 to P-021): an explicit, pure state machine.
 *
 *   preparation --startBattle--> battle --finishBattle--> reward   (victory)
 *                                                    \--> ended    (defeat or draw, P-018)
 *   reward --chooseReward--> decision                (encounters remain)
 *                       \--> ended "cleared"         (last encounter won)
 *   decision --continue--> preparation (next encounter)
 *   decision --endExpedition--> ended "retreated"
 *   ended --newExpedition--> preparation (fresh state)
 *
 * Every action is accepted only in its phase; anything else is rejected with a message and the
 * state is returned unchanged. Combat is resolved only by the M1 engine (`runBattle`); this module
 * never computes combat itself. "Expedition" is used instead of "Run", which the documentation
 * reserves for a player's win streak (GLOSSARY.md).
 */

export type Phase = 'preparation' | 'battle' | 'reward' | 'decision' | 'ended';
export type PlayerOutcome = 'victory' | 'defeat' | 'draw';
export type EndReason = 'cleared' | 'defeated' | 'draw' | 'retreated';

export interface BenchChampion {
  /** Unique within the Expedition, and used as the engine unit id. */
  readonly instanceId: string;
  readonly championId: string;
}

export interface BattleRecord {
  /** Sequential within the Expedition, starting at 1. */
  readonly number: number;
  readonly encounterIndex: number;
  readonly input: BattleInput;
  /** The engine's authoritative result, stored unchanged. */
  readonly result: BattleResult;
  readonly outcome: PlayerOutcome;
}

export interface HistoryEntry {
  readonly encounterIndex: number;
  readonly outcome: PlayerOutcome;
  readonly rewardId: string | null;
}

export interface ExpeditionState {
  readonly seed: number;
  readonly phase: Phase;
  /** Index of the current (or last fought) encounter. */
  readonly encounterIndex: number;
  readonly bench: readonly BenchChampion[];
  readonly formation: readonly Placement[];
  readonly gold: number;
  /** The battle of the current encounter; null in preparation. */
  readonly battle: BattleRecord | null;
  readonly history: readonly HistoryEntry[];
  readonly endReason: EndReason | null;
  readonly nextInstanceNumber: number;
  readonly battlesFought: number;
}

export type ExpeditionAction =
  | { readonly type: 'place'; readonly instanceId: string; readonly slot: number }
  | { readonly type: 'remove'; readonly instanceId: string }
  | { readonly type: 'startBattle' }
  | { readonly type: 'finishBattle' }
  | { readonly type: 'chooseReward'; readonly bundleId: string }
  | { readonly type: 'continue' }
  | { readonly type: 'endExpedition' }
  | { readonly type: 'newExpedition'; readonly seed: number };

export type TransitionResult =
  | { readonly ok: true; readonly state: ExpeditionState }
  | { readonly ok: false; readonly state: ExpeditionState; readonly error: string; readonly details: readonly string[] };

/** Problems in the content itself (missing or inconsistent data); empty when usable. */
export function contentProblems(content: ExpeditionContent): string[] {
  const problems: string[] = [];
  const championIds = new Set<string>();
  for (const champion of content.champions) {
    if (championIds.has(champion.id)) problems.push(`Duplicate Champion id "${champion.id}".`);
    championIds.add(champion.id);
  }
  for (const id of EXPEDITION_CONFIG.startingBench) {
    if (!championIds.has(id)) problems.push(`Starting bench Champion "${id}" is missing from the content.`);
  }
  if (content.encounters.length !== EXPEDITION_CONFIG.encounterCount) {
    problems.push(`Expected ${EXPEDITION_CONFIG.encounterCount} encounters, found ${content.encounters.length}.`);
  }
  content.encounters.forEach((encounter, index) => {
    const label = `Encounter ${index + 1}`;
    const size = encounter.monsters.length;
    if (size < M1_CONFIG.minUnitsPerSide || size > M1_CONFIG.maxUnitsPerSide) {
      problems.push(`${label} has ${size} monsters; the engine allows ${M1_CONFIG.minUnitsPerSide}-${M1_CONFIG.maxUnitsPerSide}.`);
    }
    for (const monsterFixture of encounter.monsters) {
      if (!isLegalSlot(monsterFixture.slot)) problems.push(`${label}: monster slot ${monsterFixture.slot} is not a board slot.`);
    }
    if (encounter.rewards.length !== 3) {
      problems.push(`${label} offers ${encounter.rewards.length} reward bundles; P-019 requires exactly 3.`);
    }
    const bundleIds = new Set<string>();
    for (const bundle of encounter.rewards) {
      if (bundleIds.has(bundle.id)) problems.push(`${label}: duplicate reward bundle id "${bundle.id}".`);
      bundleIds.add(bundle.id);
      if (!Number.isSafeInteger(bundle.gold) || bundle.gold < 0) problems.push(`${label}: bundle "${bundle.id}" has invalid Gold.`);
      for (const id of bundle.champions) {
        if (!championIds.has(id)) problems.push(`${label}: bundle "${bundle.id}" names unknown Champion "${id}".`);
      }
    }
  });
  return problems;
}

/**
 * P-009 battle seed for one encounter, derived from the Expedition seed and the encounter index:
 * the (index + 1)-th output of an sfc32 generator seeded with the Expedition seed.
 */
export function encounterSeed(expeditionSeed: number, encounterIndex: number): number {
  const generator = new Sfc32(expeditionSeed);
  let value = 0;
  for (let i = 0; i <= encounterIndex; i += 1) value = generator.nextUint32();
  return value;
}

export function createExpedition(seed: number): ExpeditionState {
  if (!isUint32(seed)) {
    throw new RangeError(`Expedition seed must be an integer from 0 to 4294967295; received ${seed}`);
  }
  const bench = EXPEDITION_CONFIG.startingBench.map((championId, index) => ({
    instanceId: `c${index + 1}`,
    championId,
  }));
  return {
    seed,
    phase: 'preparation',
    encounterIndex: 0,
    bench,
    formation: [],
    gold: EXPEDITION_CONFIG.startingGold,
    battle: null,
    history: [],
    endReason: null,
    nextInstanceNumber: bench.length + 1,
    battlesFought: 0,
  };
}

export function currentEncounter(state: ExpeditionState, content: ExpeditionContent): EncounterFixture | undefined {
  return content.encounters[state.encounterIndex];
}

export function championOf(instance: BenchChampion, content: ExpeditionContent): ChampionFixture | undefined {
  return content.champions.find((champion) => champion.id === instance.championId);
}

/** The engine input for the current formation and encounter (participant 0 is the player). */
export function buildBattleInput(state: ExpeditionState, content: ExpeditionContent): BattleInput | string {
  const encounter = currentEncounter(state, content);
  if (!encounter) return `Encounter ${state.encounterIndex + 1} is missing from the content.`;
  const playerUnits: UnitInput[] = [];
  for (const placement of [...state.formation].sort((a, b) => a.slot - b.slot)) {
    const instance = state.bench.find((entry) => entry.instanceId === placement.instanceId);
    const champion = instance && championOf(instance, content);
    if (!champion) return `Champion data for ${placement.instanceId} is missing.`;
    playerUnits.push({ id: placement.instanceId, slot: placement.slot, stats: champion.stats, basicAttack: champion.basicAttack });
  }
  const monsterUnits: UnitInput[] = encounter.monsters.map((monsterFixture, index) => ({
    id: `m${state.encounterIndex + 1}-${index + 1}`,
    slot: monsterFixture.slot,
    stats: monsterFixture.stats,
    basicAttack: monsterFixture.basicAttack,
  }));
  return {
    seed: encounterSeed(state.seed, state.encounterIndex),
    participants: [
      { id: EXPEDITION_CONFIG.playerParticipantId, units: playerUnits },
      { id: EXPEDITION_CONFIG.monsterParticipantId, units: monsterUnits },
    ],
  };
}

/** Maps the engine outcome to the player's point of view. */
export function playerOutcome(result: BattleResult): PlayerOutcome {
  if (result.outcome.kind === 'draw') return 'draw';
  return result.outcome.winner === EXPEDITION_CONFIG.playerParticipantId ? 'victory' : 'defeat';
}

function reject(state: ExpeditionState, error: string, details: readonly string[] = []): TransitionResult {
  return { ok: false, state, error, details };
}

function accept(state: ExpeditionState): TransitionResult {
  return { ok: true, state };
}

function wrongPhase(state: ExpeditionState, action: ExpeditionAction): TransitionResult {
  return reject(state, `"${action.type}" is not available during the ${state.phase} phase.`);
}

/** The single entry point for every state change. Pure: the input state is never mutated. */
export function transition(
  state: ExpeditionState,
  action: ExpeditionAction,
  content: ExpeditionContent,
): TransitionResult {
  switch (action.type) {
    case 'place': {
      if (state.phase !== 'preparation') return wrongPhase(state, action);
      if (!state.bench.some((entry) => entry.instanceId === action.instanceId)) {
        return reject(state, `Champion ${action.instanceId} is not on your bench.`);
      }
      if (!isLegalSlot(action.slot)) return reject(state, `Slot ${action.slot} is not a board slot.`);
      const occupant = state.formation.find((placement) => placement.slot === action.slot);
      if (occupant && occupant.instanceId !== action.instanceId) {
        return reject(state, `Slot ${action.slot} is already occupied. Remove that Champion first.`);
      }
      const others = state.formation.filter((placement) => placement.instanceId !== action.instanceId);
      const alreadyPlaced = others.length !== state.formation.length;
      if (!alreadyPlaced && others.length >= EXPEDITION_CONFIG.maxTeamSize) {
        return reject(state, `At most ${EXPEDITION_CONFIG.maxTeamSize} Champions can be fielded.`);
      }
      return accept({ ...state, formation: [...others, { instanceId: action.instanceId, slot: action.slot }] });
    }

    case 'remove': {
      if (state.phase !== 'preparation') return wrongPhase(state, action);
      if (!state.formation.some((placement) => placement.instanceId === action.instanceId)) {
        return reject(state, `Champion ${action.instanceId} is not on the board.`);
      }
      return accept({ ...state, formation: state.formation.filter((p) => p.instanceId !== action.instanceId) });
    }

    case 'startBattle': {
      // Only preparation may start a battle, so a repeated click while a battle exists is rejected.
      if (state.phase !== 'preparation') return wrongPhase(state, action);
      const dataProblems = contentProblems(content);
      if (dataProblems.length > 0) return reject(state, 'The game data is incomplete, so the battle cannot start.', dataProblems);
      const problems = formationProblems(state.formation, state.bench.map((entry) => entry.instanceId));
      if (problems.length > 0) return reject(state, 'This team cannot start a battle.', problems);
      const input = buildBattleInput(state, content);
      if (typeof input === 'string') return reject(state, 'The battle could not be prepared.', [input]);
      const validation = validateBattleInput(input);
      if (validation.length > 0) {
        return reject(state, 'The combat engine rejected this battle.', validation.map((e) => `${e.path}: ${e.message}`));
      }
      let result: BattleResult;
      try {
        result = runBattle(input);
      } catch (error) {
        return reject(state, 'The combat engine failed to run this battle.', [error instanceof Error ? error.message : String(error)]);
      }
      const number = state.battlesFought + 1;
      return accept({
        ...state,
        phase: 'battle',
        battle: { number, encounterIndex: state.encounterIndex, input, result, outcome: playerOutcome(result) },
        battlesFought: number,
      });
    }

    case 'finishBattle': {
      if (state.phase !== 'battle' || !state.battle) return wrongPhase(state, action);
      const { outcome } = state.battle;
      if (outcome === 'victory') return accept({ ...state, phase: 'reward' });
      // P-018: defeat or a draw ends the prototype Expedition; no reward.
      return accept({
        ...state,
        phase: 'ended',
        endReason: outcome === 'defeat' ? 'defeated' : 'draw',
        history: [...state.history, { encounterIndex: state.encounterIndex, outcome, rewardId: null }],
      });
    }

    case 'chooseReward': {
      if (state.phase !== 'reward' || !state.battle) return wrongPhase(state, action);
      const bundle: RewardBundle | undefined = currentEncounter(state, content)?.rewards.find((b) => b.id === action.bundleId);
      if (!bundle) return reject(state, `Reward "${action.bundleId}" is not offered for this encounter.`);
      const unknown = bundle.champions.filter((id) => !content.champions.some((champion) => champion.id === id));
      if (unknown.length > 0) return reject(state, 'This reward refers to missing Champion data.', unknown);
      const added = bundle.champions.map((championId, index) => ({
        instanceId: `c${state.nextInstanceNumber + index}`,
        championId,
      }));
      const isLast = state.encounterIndex + 1 >= EXPEDITION_CONFIG.encounterCount;
      return accept({
        ...state,
        phase: isLast ? 'ended' : 'decision',
        endReason: isLast ? 'cleared' : null,
        gold: state.gold + bundle.gold,
        bench: [...state.bench, ...added],
        nextInstanceNumber: state.nextInstanceNumber + added.length,
        history: [...state.history, { encounterIndex: state.encounterIndex, outcome: 'victory', rewardId: bundle.id }],
      });
    }

    case 'continue': {
      if (state.phase !== 'decision') return wrongPhase(state, action);
      // The formation is kept so the player can adjust it; the finished battle is cleared.
      return accept({ ...state, phase: 'preparation', encounterIndex: state.encounterIndex + 1, battle: null });
    }

    case 'endExpedition': {
      if (state.phase !== 'decision') return wrongPhase(state, action);
      return accept({ ...state, phase: 'ended', endReason: 'retreated' });
    }

    case 'newExpedition': {
      if (state.phase !== 'ended') return wrongPhase(state, action);
      if (!isUint32(action.seed)) return reject(state, `Seed must be an integer from 0 to 4294967295.`);
      return accept(createExpedition(action.seed));
    }
  }
}

/** Parses a user-supplied Expedition seed (decimal uint32); null if absent or invalid. */
export function parseSeed(text: string | null | undefined): number | null {
  if (text === null || text === undefined || !/^\d{1,10}$/.test(text.trim())) return null;
  const value = Number(text.trim());
  return isUint32(value) ? value : null;
}
