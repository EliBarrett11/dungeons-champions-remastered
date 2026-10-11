import { BattleRng, M1_CONFIG, Sfc32, isUint32, rollDie, runBattle, validateBattleInput } from '@dc/engine';
import type { BattleInput, BattleResult, UnitInput } from '@dc/engine';
import type { PlayableChampion } from './champions';
import { EXPEDITION_CONFIG } from './config';
import type { ExpeditionContent } from './content';
import type { EncounterFixture } from './fixtures';
import { applyGoldChange, goldAccountProblems, startingGoldAccount } from './gold';
import { NO_SHOP, SHOP_ROOT_OUTPUT, economyConfigProblems, generateShop } from './shop';
import type { EconomySettings, ShopState } from './shop';
import { formationProblems, isLegalSlot } from './formation';
import type { Placement } from './formation';

/**
 * The prototype Expedition (M2: P-018 to P-021; M3: P-022): an explicit, pure state machine.
 * Since M3 the bench and the Champions offered as rewards are drawn by seed from the approved
 * roster when the Expedition is created (`drawRosterChampions`), so a seed replays exactly.
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

/** One reward bundle as offered in this Expedition: the P-019 template with its drawn Champions. */
export interface RewardOffer {
  readonly id: string;
  readonly gold: number;
  /** Roster Champion ids (P-022). */
  readonly champions: readonly string[];
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
  /** Gold held; changed only through applyGoldChange (gold.ts). */
  readonly gold: number;
  /** Total Gold received this Expedition (reward Gold; P-026). */
  readonly goldEarned: number;
  /** Total Gold spent this Expedition (0 until purchases and rerolls exist). */
  readonly goldSpent: number;
  /** The battle of the current encounter; null in preparation. */
  readonly battle: BattleRecord | null;
  readonly history: readonly HistoryEntry[];
  readonly endReason: EndReason | null;
  readonly nextInstanceNumber: number;
  readonly battlesFought: number;
  /** Reward offers per encounter, fixed when the Expedition is created. */
  readonly offers: readonly (readonly RewardOffer[])[];
  /** M4: the Tavern on display (P-023): shop 0 from creation, a fresh shop each Monster Round. */
  readonly shop: ShopState;
  /** M4: shop number k for the next successful shop generation (P-029); 1 after creation. */
  readonly nextShopNumber: number;
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
/** `economy` defaults to the real settings; tests pass variants to prove they are validated. */
export function contentProblems(content: ExpeditionContent, economy: EconomySettings = EXPEDITION_CONFIG): string[] {
  const problems: string[] = [];
  const championIds = new Set<string>();
  for (const champion of content.champions) {
    if (championIds.has(champion.id)) problems.push(`Duplicate Champion id "${champion.id}".`);
    championIds.add(champion.id);
  }
  const needed = championsNeeded(content);
  if (content.champions.length < needed) {
    problems.push(`The roster has ${content.champions.length} playable Champions; an Expedition draws ${needed}.`);
  }
  problems.push(...economyConfigProblems(economy));
  // P-029: outputs 1..encounterCount are battle seeds and output encounterCount + 1 seeds the
  // roster draw; both must stay below the shop stream's root output.
  if (economy.encounterCount + 1 >= SHOP_ROOT_OUTPUT) {
    problems.push(`${economy.encounterCount} encounters would make the roster draw collide with the shop stream (output ${SHOP_ROOT_OUTPUT}).`);
  }
  // P-028 / P-031: a shop must be fillable even with a full collection and every reward reserved.
  const reserved = needed - economy.startingBenchSize;
  const eligible = Math.max(0, content.champions.length - economy.maxOwnedChampions - reserved);
  if (eligible < economy.shopSlots) {
    problems.push(`Only ${eligible} Champions could be offered with a full collection; the shop has ${economy.shopSlots} slots.`);
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
      if (!Number.isSafeInteger(bundle.championCount) || bundle.championCount < 0) {
        problems.push(`${label}: bundle "${bundle.id}" has an invalid Champion count.`);
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

/** Champions drawn per Expedition: the starting bench plus every Champion any bundle offers. */
export function championsNeeded(content: ExpeditionContent): number {
  const offered = content.encounters.reduce(
    (sum, encounter) => sum + encounter.rewards.reduce((inner, bundle) => inner + Math.max(0, bundle.championCount), 0),
    0,
  );
  return EXPEDITION_CONFIG.startingBenchSize + offered;
}

/**
 * P-022: the Expedition's Champions, drawn without repeats from the roster (in roster order) by a
 * partial Fisher-Yates shuffle. The generator is seeded with the next output after the battle
 * seeds (`encounterSeed(seed, encounterCount)`), so the draw never shares numbers with a battle.
 * The first `startingBenchSize` ids form the bench; the rest fill the reward bundles in order.
 */
export function drawRosterChampions(seed: number, content: ExpeditionContent): string[] {
  const needed = championsNeeded(content);
  const pool = content.champions.map((champion) => champion.id);
  if (pool.length < needed) throw new RangeError(`The roster has ${pool.length} Champions; ${needed} are needed.`);
  const rng = new BattleRng(encounterSeed(seed, EXPEDITION_CONFIG.encounterCount));
  for (let i = 0; i < needed; i += 1) {
    const j = i + rollDie(rng, pool.length - i) - 1;
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, needed);
}

export function createExpedition(seed: number, content: ExpeditionContent): ExpeditionState {
  if (!isUint32(seed)) {
    throw new RangeError(`Expedition seed must be an integer from 0 to 4294967295; received ${seed}`);
  }
  const drawn = drawRosterChampions(seed, content);
  const bench = drawn.slice(0, EXPEDITION_CONFIG.startingBenchSize).map((championId, index) => ({
    instanceId: `c${index + 1}`,
    championId,
  }));
  let next = EXPEDITION_CONFIG.startingBenchSize;
  const offers = content.encounters.map((encounter) =>
    encounter.rewards.map((bundle) => {
      const champions = drawn.slice(next, next + bundle.championCount);
      next += bundle.championCount;
      return { id: bundle.id, gold: bundle.gold, champions };
    }),
  );
  const created: ExpeditionState = {
    seed,
    phase: 'preparation',
    encounterIndex: 0,
    bench,
    formation: [],
    ...startingGoldAccount(),
    battle: null,
    history: [],
    endReason: null,
    nextInstanceNumber: bench.length + 1,
    battlesFought: 0,
    offers,
    shop: NO_SHOP,
    nextShopNumber: 0,
  };
  // P-023: shop 0 is on offer for Round 1 preparation.
  return withNewShop(created, content);
}

/** Eligible shop Champions in roster order: not owned (P-028), not reserved for rewards (P-031). */
export function shopCandidates(state: ExpeditionState, content: ExpeditionContent): { id: string; costRank: number }[] {
  const owned = new Set(state.bench.map((entry) => entry.championId));
  const reserved = reservedRewardChampions(state);
  return content.champions
    .filter((champion) => !owned.has(champion.id) && !reserved.has(champion.id))
    .map((champion) => ({ id: champion.id, costRank: champion.proposed.cost_rank }));
}

/** Generates the next shop (number `nextShopNumber`) and advances the shop numbering by one. */
function withNewShop(state: ExpeditionState, content: ExpeditionContent): ExpeditionState {
  const shop = generateShop(state.seed, state.nextShopNumber, shopCandidates(state, content));
  return { ...state, shop, nextShopNumber: state.nextShopNumber + 1 };
}

/** The six (in general: all) Champions reserved for this Expedition's reward choices (P-031). */
export function reservedRewardChampions(state: ExpeditionState): ReadonlySet<string> {
  return new Set(state.offers.flat().flatMap((offer) => offer.champions));
}

/**
 * Economy invariants of a state (M4 state model). Empty when the state is consistent. Used by
 * tests now and by every later checkpoint to prove that no action leaves a broken economy.
 */
export function economyStateProblems(state: ExpeditionState, content: ExpeditionContent): string[] {
  const problems: string[] = [];
  problems.push(...goldAccountProblems(state));
  if (state.bench.length > EXPEDITION_CONFIG.maxOwnedChampions) {
    problems.push(`${state.bench.length} Champions are owned; the cap is ${EXPEDITION_CONFIG.maxOwnedChampions} (P-027).`);
  }
  const owned = new Set(state.bench.map((entry) => entry.championId));
  if (owned.size !== state.bench.length) problems.push('A Champion is owned more than once (P-028).');
  if (!Number.isSafeInteger(state.nextShopNumber) || state.nextShopNumber < 0) {
    problems.push(`The next shop number must be a whole number, 0 or more (got ${state.nextShopNumber}).`);
  }
  const { shop } = state;
  if (shop.number === null) {
    if (shop.slots.length > 0) problems.push('The shop has offers but no shop number.');
  } else {
    if (!Number.isSafeInteger(shop.number) || shop.number < 0 || shop.number >= state.nextShopNumber) {
      problems.push(`Shop number ${shop.number} must be below the next shop number ${state.nextShopNumber}.`);
    }
    if (shop.slots.length !== EXPEDITION_CONFIG.shopSlots) {
      problems.push(`The shop has ${shop.slots.length} slots; it must have ${EXPEDITION_CONFIG.shopSlots} (P-023).`);
    }
  }
  const reserved = reservedRewardChampions(state);
  const offered = new Set<string>();
  shop.slots.forEach((slot, index) => {
    const label = `Shop slot ${index + 1}`;
    const champion = content.champions.find((entry) => entry.id === slot.championId);
    if (!champion) problems.push(`${label} offers unknown Champion "${slot.championId}".`);
    else if (slot.price !== champion.proposed.cost_rank) problems.push(`${label}: price ${slot.price} is not the cost rank ${champion.proposed.cost_rank} (P-024).`);
    if (slot.priceStatus !== 'provisional') problems.push(`${label}: prices must be marked provisional (P-024).`);
    if (offered.has(slot.championId)) problems.push(`${label} repeats ${slot.championId}.`);
    offered.add(slot.championId);
    if (reserved.has(slot.championId)) problems.push(`${label} offers reserved reward Champion ${slot.championId} (P-031).`);
    if (!slot.sold && owned.has(slot.championId)) problems.push(`${label} offers owned Champion ${slot.championId} (P-028).`);
  });
  return problems;
}

/** The reward offers for the current encounter. */
export function currentOffers(state: ExpeditionState): readonly RewardOffer[] {
  return state.offers[state.encounterIndex] ?? [];
}

export function currentEncounter(state: ExpeditionState, content: ExpeditionContent): EncounterFixture | undefined {
  return content.encounters[state.encounterIndex];
}

export function championOf(instance: BenchChampion, content: ExpeditionContent): PlayableChampion | undefined {
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
      const bundle = currentOffers(state).find((b) => b.id === action.bundleId);
      if (!bundle) return reject(state, `Reward "${action.bundleId}" is not offered for this encounter.`);
      const unknown = bundle.champions.filter((id) => !content.champions.some((champion) => champion.id === id));
      if (unknown.length > 0) return reject(state, 'This reward refers to missing Champion data.', unknown);
      const added = bundle.champions.map((championId, index) => ({
        instanceId: `c${state.nextInstanceNumber + index}`,
        championId,
      }));
      // P-026: the bundle's Gold goes through the single Gold path (gold.ts).
      const paid = applyGoldChange(state, { kind: 'reward', amount: bundle.gold });
      if (!paid.ok) return reject(state, 'This reward could not be applied.', [paid.error]);
      const isLast = state.encounterIndex + 1 >= EXPEDITION_CONFIG.encounterCount;
      return accept({
        ...paid.account,
        phase: isLast ? 'ended' : 'decision',
        endReason: isLast ? 'cleared' : null,
        bench: [...state.bench, ...added],
        nextInstanceNumber: state.nextInstanceNumber + added.length,
        history: [...state.history, { encounterIndex: state.encounterIndex, outcome: 'victory', rewardId: bundle.id }],
      });
    }

    case 'continue': {
      if (state.phase !== 'decision') return wrongPhase(state, action);
      // The formation is kept so the player can adjust it; the finished battle is cleared.
      // P-023: the Tavern refreshes automatically for the new Monster Round.
      return accept(withNewShop({ ...state, phase: 'preparation', encounterIndex: state.encounterIndex + 1, battle: null }, content));
    }

    case 'endExpedition': {
      if (state.phase !== 'decision') return wrongPhase(state, action);
      return accept({ ...state, phase: 'ended', endReason: 'retreated' });
    }

    case 'newExpedition': {
      if (state.phase !== 'ended') return wrongPhase(state, action);
      if (!isUint32(action.seed)) return reject(state, `Seed must be an integer from 0 to 4294967295.`);
      const problems = contentProblems(content);
      if (problems.length > 0) return reject(state, 'The game data is incomplete, so a new Expedition cannot start.', problems);
      return accept(createExpedition(action.seed, content));
    }
  }
}

/** Parses a user-supplied Expedition seed (decimal uint32); null if absent or invalid. */
export function parseSeed(text: string | null | undefined): number | null {
  if (text === null || text === undefined || !/^\d{1,10}$/.test(text.trim())) return null;
  const value = Number(text.trim());
  return isUint32(value) ? value : null;
}
