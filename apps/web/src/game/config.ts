/**
 * Every tunable number of the M2 prototype Expedition lives here.
 *
 * Status: PROVISIONAL prototype values approved by the owner on 2026-10-11 (DECISIONS.md, P-018 to
 * P-031). They are not CONFIRMED game rules. Combat numbers stay in the engine's M1_CONFIG. The
 * approved maximum team size of 12 (D-019) does not change these prototype limits.
 */
export const EXPEDITION_CONFIG = Object.freeze({
  /** P-018: Monster Rounds in one prototype Expedition (documented: Floor 1 opens with three). */
  encounterCount: 3,
  /** P-020: Champions the player may field per battle. Renown is not implemented (R-005). */
  minTeamSize: 1,
  maxTeamSize: 3,
  /** P-020 / P-022: Champions on the starting bench, drawn by seed from the approved roster. */
  startingBenchSize: 4,
  /**
   * Gold at the start of an Expedition. P-025 sets this to 3; the change is applied with the Gold
   * accounting in M4 checkpoint B, not in checkpoint A.
   */
  startingGold: 0,
  /** P-023: Tavern (shop) slots. */
  shopSlots: 6,
  /** P-023: Gold cost of a reroll ("Purchase a Drink"), which replaces every slot. */
  rerollCost: 2,
  /** P-027 / P-030: most Champions a player may own, from every source (shop and rewards). */
  maxOwnedChampions: 12,
  /** The player's participant id in every battle (participant 0). */
  playerParticipantId: 'player',
  /** The monsters' participant id in every battle (participant 1). */
  monsterParticipantId: 'monsters',
});

export type ExpeditionConfig = typeof EXPEDITION_CONFIG;
