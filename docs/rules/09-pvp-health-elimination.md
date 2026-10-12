# 09 — PvP, Player Health and Elimination

Tags and conventions: see [00 — Index](00-INDEX.md). Nothing in this rulebook is implemented. The owner deferred two-player matches, bots, player Health and match-end rules to the multiplayer milestone (`docs/IMPLEMENTATION/ROADMAP.md`, M8).

## 1. Player Health

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| PVP-01 | Each player starts with **100 Health**. | APPROVED DESIGN | NOT IMPLEMENTED | D-006 |
| PVP-02 | Health is a whole number. It is reduced by losing Rounds and clamped at 0. | APPROVED DESIGN (reduced by losses; D-006, D-028); whole number and clamping follow the combat convention (P-012). The clamping itself needs confirmation (U-10). | NOT IMPLEMENTED | — |
| PVP-03 | Whether player Health can be restored. No healing source is documented. | UNRESOLVED (U-10) | — | — |

## 2. Pairing

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| PVP-10 | PvP battles are simultaneous 1v1 pairings. | DRAFT | NOT IMPLEMENTED | `GAMEPLAY/MATCH_FLOW.md` |
| PVP-11 | Pairings are random. They avoid opponents faced in the previous three Rounds where possible. Making valid pairings has higher priority than this avoidance. | DRAFT; the algorithm is UNRESOLVED (U-24) | NOT IMPLEMENTED | `GAMEPLAY/MATCH_FLOW.md` |
| PVP-12 | With an odd number of players, one player fights a PvE opponent whose strength matches the average team strength of the remaining players. That player gets the baseline Gold and Fame, but no PvP win-streak bonus. | DRAFT; selection and scaling UNRESOLVED (U-24) | NOT IMPLEMENTED | `GAMEPLAY/MATCH_FLOW.md` |
| PVP-13 | Whether "previous three Rounds" counts Monster Rounds. | UNRESOLVED (U-24) | — | — |

## 3. Outcome and loss damage

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| PVP-20 | The PvP battle result comes from the combat engine: win, loss or draw ([03](03-combat-engine.md) CMB-12). | PROVISIONAL (engine rules) | IMPLEMENTED (engine only) | P-006 |
| PVP-21 | **Loss damage concept.** The losing player's Health loss depends on (a) the Round and (b) the remaining Health of the winning opponent's surviving Champions. | APPROVED DESIGN (concept) | NOT IMPLEMENTED | D-028 |
| PVP-22 | **Loss damage formula.** Not decided. One previously discussed candidate is `ceil(H/100 × [1 + 0.10 × (R − 1) + 0.25 × (F − 1)])`, where H is the surviving enemy Health, R the Round and F the Floor. It is only a proposal. | UNRESOLVED (U-10); the candidate is PROPOSED | NOT IMPLEMENTED | `GAMEPLAY/MATCH_FLOW.md` |
| PVP-23 | Whether H is the summed current Health of surviving enemy Champions, or a share of their maximum. Whether the Floor is a separate term or implied by the Round. Whether a minimum or maximum damage applies. | UNRESOLVED (U-10) | — | — |
| PVP-24 | Health damage after a drawn PvP battle, and after a loss to the odd-player PvE opponent. | UNRESOLVED (U-10) | — | — |
| PVP-25 | The winner takes no Health damage. | DRAFT (implied by "losing" in D-028; confirm) | — | D-028 |

**Executable outline.** Steps marked UNRESOLVED must be decided first.

```
afterPvpBattle(winner, loser, round, result):
  if result is draw: apply the draw rule                                  # U-10
  H ← remaining Health of the winner's surviving Champions               # PVP-23, U-10
  damage ← lossDamage(H, round)                                          # PVP-22, U-10
  loser.health ← max(0, loser.health − damage)                           # PVP-02
  end the loser's Run; the winner's streak +1                            # PVP-30
```

No worked numeric example is given, because the formula is UNRESOLVED.

## 4. Runs (win streaks)

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| PVP-30 | Each player has a Run (win streak). Losing a Round ends the Run and resets the streak, but does not eliminate the player. Ending a Run does not reset the team, Items, levels, Feats, fielding progression, Gold, Fame or Renown. | DRAFT | NOT IMPLEMENTED | `GAMEPLAY/ECONOMY.md` |
| PVP-31 | Streak bonus Gold schedule (the prior proposal: 1 win +0; 2–3 +1; 4–5 +2; 6+ +3). Whether streaks carry across Floors. Whether Monster Round wins count. | PROPOSED (NOT APPROVED); UNRESOLVED (U-33) | NOT IMPLEMENTED | `GAMEPLAY/ECONOMY.md` |

## 5. Run-End Upgrades (summary; canonical: `docs/GAMEPLAY/ECONOMY.md`)

| ID | Rule | Design status | Implementation |
|---|---|---|---|
| PVP-40 | When a Run ends, the player chooses one of three random, balanced, system-wide upgrades. Its tier reflects the Health lost in the Round that ended the Run. Upgrades are permanent and public. | DRAFT | NOT IMPLEMENTED |
| PVP-41 | Upgrade catalogue, tier thresholds and generation. | UNRESOLVED (U-23) | NOT IMPLEMENTED |

## 6. Elimination and the end of the match

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| PVP-50 | A player at 0 Health is eliminated. | APPROVED DESIGN | NOT IMPLEMENTED | D-006 |
| PVP-51 | When a player is eliminated, their Items and Components are destroyed, not transferred. | APPROVED DESIGN | NOT IMPLEMENTED | D-012 |
| PVP-52 | When a player is eliminated, all of their Champions return to the shared pool. Whether their reserved reward options are released is not decided. | DRAFT (Champions); UNRESOLVED (reservations, U-11) | NOT IMPLEMENTED | `GAMEPLAY/CHAMPIONS.md` |
| PVP-53 | An eliminated player can still spectate (CORE-04). | APPROVED DESIGN | NOT IMPLEMENTED | D-008 |
| PVP-54 | The last player standing wins and fights the Dragon ([02](02-match-structure.md) MATCH-30). Simultaneous final eliminations and placements are not decided (MATCH-31). | APPROVED DESIGN; edge cases UNRESOLVED (U-09) | NOT IMPLEMENTED | D-006, D-007 |

## 7. Required tests (when implemented)

- Health starts at 100, never goes below 0, and elimination happens exactly at 0.
- Loss damage matches the approved formula on table-driven cases, including the rounding.
- A winner takes no damage, if confirmed.
- Pairing never pairs a player with themselves. Repeats within the last three Rounds are avoided whenever a valid alternative exists. The bye/PvE player is chosen deterministically from the seed.
- An eliminated player gets no further Rounds or income. Their Items are destroyed and their Champions are released.
- The match ends with exactly one winner, or with the documented rule for simultaneous elimination.
