export { M1_CONFIG } from './config';
export type { M1Config } from './config';
export { Sfc32, isUint32 } from './rng/sfc32';
export type { Sfc32State } from './rng/sfc32';
export { BattleRng } from './rng/rng';
export type { Rng } from './rng/rng';
export { rollDie, rollDice } from './rng/dice';
export { drawSideAssignment } from './rng/sides';
export type { SideAssignment } from './rng/sides';
export type {
  Side,
  BattleInput,
  ParticipantInput,
  UnitInput,
  UnitStats,
  BasicAttackInput,
  ValidationError,
} from './types';
export { validateBattleInput, assertValidBattleInput, InvalidBattleInputError } from './validate';
export { setupBattle } from './battle/setup';
export type { BattleSetup, SetupOptions, UnitState } from './battle/setup';
export { canonicalJson, serializeEvents } from './log/serialize';
export { runBattle } from './battle/run';
export type { BattleResult } from './battle/run';
export { nextMoment } from './battle/schedule';
export type { NextMoment } from './battle/schedule';
export { selectTarget, rowOfSlot } from './rules/targeting';
export type { TargetCandidate } from './rules/targeting';
export { LOG_VERSION } from './battle/events';
export type {
  SetupEvent,
  BattleStartEvent,
  SidesAssignedEvent,
  InitiativeRolledEvent,
  InitiativeResolvedEvent,
  CombatEvent,
  BattleEvent,
  BattleOutcome,
  OvertimeStepEvent,
  AttackSkippedEvent,
  AttackCommittedEvent,
  AttackResolvedEvent,
  UnitDefeatedEvent,
  BattleEndEvent,
} from './battle/events';
export { parseDiceExpression, rollDiceExpression } from './dice/parse';
export type { DiceExpression, DiceParseResult, DiceRoll } from './dice/parse';
export { attackIntervalMs, firstActualAttackAtMs } from './rules/interval';
export { overtimeMultiplier, overtimeBoundariesMs } from './rules/overtime';
export { resolveHit } from './rules/hit';
export type { HitInput, HitResult } from './rules/hit';
export { computeHitDamage } from './rules/damage';
export type { HitDamage, HitDamageInput } from './rules/damage';
export { initiativeTotal, skipsFirstAttack, openingUltimateWinners } from './rules/initiative';
export { compareActionOrder, sortByActionOrder } from './rules/ordering';
export type { OrderKey } from './rules/ordering';
