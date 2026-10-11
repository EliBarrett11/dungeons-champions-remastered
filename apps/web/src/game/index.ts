export { EXPEDITION_CONFIG } from './config';
export type { ExpeditionConfig } from './config';
export { PROTOTYPE_CONTENT, ROLE_STATS, FIXTURE_BASIC_ATTACK } from './fixtures';
export type { ChampionFixture, EncounterFixture, ExpeditionContent, MonsterFixture, RewardBundle, FixtureRole } from './fixtures';
export { boardRows, formationProblems, isLegalSlot, rowName } from './formation';
export type { Placement, RowName } from './formation';
export {
  buildBattleInput,
  championOf,
  contentProblems,
  createExpedition,
  currentEncounter,
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
  TransitionResult,
} from './expedition';
export { buildBattleView, eventCountAt, outcomeText, snapshotAfter } from './battleView';
export type { BattleView, LogLine, Team, UnitSnapshot, ViewUnit } from './battleView';
