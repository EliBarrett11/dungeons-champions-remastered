# 02 — Match Structure

Tags and conventions: see [00 — Index](00-INDEX.md). How these pieces run in sequence: [10 — Full Match Flow](10-match-flow.md).

## 1. Players and match length

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| MATCH-01 | A match begins with eight players. | APPROVED DESIGN | NOT IMPLEMENTED | D-001 |
| MATCH-02 | Design target: **5 Floors, 23 Rounds** in total. | APPROVED DESIGN (target) | NOT IMPLEMENTED | D-022 |
| MATCH-03 | The match ends when exactly one player remains, even before Round 23 (MATCH-30). | APPROVED DESIGN | NOT IMPLEMENTED | D-006, D-022 |
| MATCH-04 | How the 23 Rounds are divided among the 5 Floors, and which Rounds are Monster Rounds or PvP Rounds. Only Floor 1 is known (MATCH-11). | UNRESOLVED (U-08) | NOT IMPLEMENTED | B7 |

## 2. Rounds

A **Round** is one stage in which every remaining player fights exactly one battle, at the same time as the others.

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| MATCH-10 | Every Round is either a **Monster Round** (PvE) or a **PvP Round**. | APPROVED DESIGN (by D-022's use of both); details DRAFT | PROTOTYPE: Monster Rounds only (`apps/web/src/game/fixtures.ts`) | `GAMEPLAY/MATCH_FLOW.md` |
| MATCH-11 | Floor 1 opens with three Monster Rounds before the first PvP Round. | DRAFT; the prototype adopts the three Monster Rounds (P-018) | PROTOTYPE: `EXPEDITION_CONFIG.encounterCount = 3` | `GAMEPLAY/MATCH_FLOW.md`, P-018 |
| MATCH-12 | In a PvP Round, players are paired 1v1. With an odd number of players remaining, one player fights a PvE opponent instead. | DRAFT | NOT IMPLEMENTED | `GAMEPLAY/MATCH_FLOW.md`; see [09](09-pvp-health-elimination.md) |
| MATCH-13 | Round numbering: Rounds are numbered 1 to 23 across the match. This document uses that numbering, which follows D-022's count. Whether Floors restart the count is not stated. Formulas that use "Round" (e.g. loss damage, U-10) must say which numbering they use. | UNRESOLVED (U-08) | NOT IMPLEMENTED | — |

## 3. Phases of a Round

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| MATCH-20 | Every Round has a **preparation phase** before its battle. In preparation, players use the Tavern, place Champions and make other pre-battle choices. | APPROVED DESIGN (D-025 refers to "every preparation phase") | PROTOTYPE: phase `preparation` (`apps/web/src/game/expedition.ts`) | D-025 |
| MATCH-21 | The Tavern refreshes automatically at **every** preparation phase, for Monster and PvP Rounds alike ([07](07-tavern-economy.md) ECO-20). | APPROVED DESIGN | PROTOTYPE: refreshed on each Monster Round | D-025, P-023 |
| MATCH-22 | Battles are automated. Players make no input during a battle. | APPROVED DESIGN | IMPLEMENTED: `runBattle` (`packages/engine/src/battle/run.ts`) | D-001 |
| MATCH-23 | After the battle: outcome effects are applied (loss damage, rewards, Fame, Run/streak), then eliminations are checked, then the next Round begins. The order of these steps is UNRESOLVED (U-06, U-35). | UNRESOLVED | NOT IMPLEMENTED | — |
| MATCH-24 | Preparation length, timers and "ready" handling in a multiplayer match. | UNRESOLVED (U-36) | NOT IMPLEMENTED | — |

**Prototype phase machine (IMPLEMENTED, `apps/web/src/game/expedition.ts`).** These phases are a prototype stand-in. They are not the full-game phase list.

```
preparation --startBattle--> battle --finishBattle--> reward   (victory)
                                                  \--> ended    (defeat or draw; P-018)
reward --chooseReward--> decision                    (Monster Rounds 1-2)
                     \--> ended (cleared)             (after Monster Round 3)
decision --continue--> preparation (next Monster Round; new shop)
         \--endExpedition--> ended (retreated; R-003)
ended --newExpedition(seed)--> preparation (fresh Expedition)
```

Any action in the wrong phase is rejected, and the state is unchanged (`wrongPhase`).

## 4. Floors and Routes

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| MATCH-40 | The match is divided into five Floors (MATCH-02). | APPROVED DESIGN (target) | NOT IMPLEMENTED | D-022 |
| MATCH-41 | At the start of each Floor, each player chooses one of several Routes. A Route's rewards, risks and challenges are revealed before the choice. Route effects last for that Floor and may change rewards, PvP conditions, PvE opponents and difficulty. Routes converge at the next Floor. | DRAFT | NOT IMPLEMENTED | `GAMEPLAY/DUNGEON_AND_REWARDS.md` |
| MATCH-42 | Number of Routes, how they are generated, their modifiers, and which player's modifiers apply when players on different Routes fight each other. | UNRESOLVED (U-23) | NOT IMPLEMENTED | `OPEN_QUESTIONS.md` |

## 5. Match termination

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| MATCH-30 | The match ends after the elimination check of a Round that leaves exactly one player. That player wins (D-006) and then fights the Dragon (D-007). | APPROVED DESIGN | NOT IMPLEMENTED | D-006, D-007 |
| MATCH-31 | If the last remaining players are all eliminated in the same Round, who wins, and how placements are ordered for simultaneous eliminations. | UNRESOLVED (U-09) | NOT IMPLEMENTED | `OPEN_QUESTIONS.md` |
| MATCH-32 | What happens if more than one player remains after Round 23 (the target length, D-022). | UNRESOLVED (U-09) | NOT IMPLEMENTED | — |
| MATCH-33 | Whether the Dragon fight counts as one of the 23 Rounds, and what its outcome changes. | UNRESOLVED (U-23) | NOT IMPLEMENTED | D-007 |

**Prototype termination (IMPLEMENTED, PROVISIONAL).** An Expedition ends in one of four ways (`EndReason` in `apps/web/src/game/expedition.ts`):
- `cleared`: after winning Monster Round 3 and taking its reward;
- `defeated`: after a defeat;
- `draw`: after a draw;
- `retreated`: after "End Expedition" in the decision phase.

Sources: P-018 and R-003.

## 6. Edge cases

- **One player left before Round 23.** The match ends at once (MATCH-03). No further Rounds, Tavern refreshes or income happen.
- **Odd number of players.** One player fights PvE (MATCH-12). How that player is chosen is UNRESOLVED (U-24).
- **Floor 1 before any PvP.** Monster difficulty is meant to depend on the "last-placed player", which is undefined before any PvP Round (U-16).

## 7. Required tests (when implemented)

- A match with one player left after Round *n* < 23 ends at Round *n*. No later Round runs.
- The Round schedule is read from configuration: 5 Floors, 23 Rounds, and each Round's type from the approved schedule (U-08). Configuration validation rejects a schedule with a different total, or one where Floor 1 does not open with three Monster Rounds.
- Every preparation phase, Monster or PvP, produces a new Tavern (ECO-20).
- An action outside its phase is rejected and returns an identical state. The prototype has this test in `apps/web/test/expedition.test.ts` and `run-flow.test.ts`.
