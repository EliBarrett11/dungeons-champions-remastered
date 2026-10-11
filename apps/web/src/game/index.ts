export { EXPEDITION_CONFIG } from './config';
export type { ExpeditionConfig } from './config';
export { PROTOTYPE_ENCOUNTERS, ROLE_STATS, FIXTURE_BASIC_ATTACK } from './fixtures';
export type { EncounterFixture, MonsterFixture, RewardBundle, FixtureRole } from './fixtures';
export { PROTOTYPE_CONTENT } from './content';
export type { ExpeditionContent } from './content';
export { PLACEHOLDER_STATS, ROSTER_CHAMPIONS, ROSTER_VALIDATION, playableChampion } from './champions';
export type { PlayableChampion, StatsSource } from './champions';
export { boardRows, formationProblems, isLegalSlot, rowName } from './formation';
export type { Placement, RowName } from './formation';
export {
  buildBattleInput,
  championOf,
  contentProblems,
  championsNeeded,
  createExpedition,
  currentEncounter,
  currentOffers,
  drawRosterChampions,
  economyStateProblems,
  reservedRewardChampions,
  shopCandidates,
  encounterSeed,
  parseSeed,
  playerOutcome,
  transition,
} from './expedition';
export type {
  BattleRecord,
  BenchChampion,
  EndReason,
  ExpeditionAction,
  ExpeditionState,
  HistoryEntry,
  Phase,
  PlayerOutcome,
  RewardOffer,
  TransitionResult,
} from './expedition';
export { buildBattleView, eventCountAt, outcomeText, snapshotAfter } from './battleView';
export type { BattleView, LogLine, Team, UnitSnapshot, ViewUnit } from './battleView';
export { DOCUMENTED_ROLES, ROSTER_RULES, TRAIT_CANON, validateRoster } from './roster';
export type { ProposedChampionContent, Roster, RosterChampion, RosterValidation, TraitCanon } from './roster';
export { NO_SHOP, SHOP_ROOT_OUTPUT, economyConfigProblems, generateShop, shopRootSeed, shopSeed } from './shop';
export type { EconomySettings, ShopCandidate, ShopSlot, ShopState } from './shop';
export { applyGoldChange, goldAccountProblems, startingGoldAccount } from './gold';
export type { GoldAccount, GoldChange, GoldIncome, GoldResult, GoldSpending } from './gold';
export { buyAvailability, priceLabel, rerollAvailability, rewardAvailability } from './shopView';
export type { Availability } from './shopView';
