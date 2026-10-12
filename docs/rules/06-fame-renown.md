# 06 — Fame and Renown

Tags and conventions: see [00 — Index](00-INDEX.md). Nothing in this rulebook is implemented. The prototype has no Fame or Renown, and its fielding limit is a fixed 1–3 (P-020, R-005).

## 1. Fame

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| FAME-01 | Fame is a player resource. Accumulated Fame determines Renown. | APPROVED DESIGN | NOT IMPLEMENTED | D-023; `GAMEPLAY/ECONOMY.md` |
| FAME-02 | Fame and Renown persist across Runs. A Run ending does not reset them. | DRAFT | NOT IMPLEMENTED | `GAMEPLAY/ECONOMY.md` |
| FAME-03 | **"Play my song"** (the Bard action in the Tavern) costs **4 Gold** and grants **4 Fame**. | APPROVED DESIGN; the values are configuration | NOT IMPLEMENTED | D-024 |
| FAME-04 | **Round Fame rewards**: Fame granted to players each Round. The owner approved a table for testing, but its values are not in any project record. | PROVISIONAL (approved for testing); values UNRESOLVED (U-02) | NOT IMPLEMENTED | D-024 |
| FAME-05 | A player matched against PvE in a PvP Round still receives the baseline Fame. | DRAFT | NOT IMPLEMENTED | `GAMEPLAY/MATCH_FLOW.md` |
| FAME-06 | Whether Fame depends on the battle outcome, on the Round type, or on neither. | UNRESOLVED (U-02) | — | — |

**"Play my song" — executable rule.** Only the purchase step can be fully specified now.

```
playMySong(player):
  precondition: phase = preparation (consistent with every Tavern action; ECO-02)
  precondition: player.gold ≥ 4                     # else reject; state unchanged
  player.gold ← player.gold − 4                     # through the single Gold path (ECO-03)
  player.fame ← player.fame + 4
  recompute Renown (FAME-21)
```

UNRESOLVED (U-28):
- whether "Play my song" can be used more than once per preparation phase;
- whether it can be used at Renown 12;
- whether it is part of the Tavern refresh (a slot) or a separate action.

## 2. Renown

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| FAME-20 | Renown **starts at 3** and has a **maximum of 12**. A player may field **one Champion per Renown level**, so their fielding capacity equals their Renown. | APPROVED DESIGN | NOT IMPLEMENTED | D-023 (start), D-019 (cap) |
| FAME-21 | Renown is set by Fame thresholds: `Renown = max(3, the highest level L whose Fame threshold ≤ Fame)`, capped at 12. The threshold table was approved for testing, but its values are not in any project record. The form of this formula is read from "Fame determines Renown" and must be confirmed with the table (U-01). | PROVISIONAL (approved for testing); values UNRESOLVED (U-01) | NOT IMPLEMENTED | D-023 |
| FAME-22 | Whether Renown can ever decrease. No rule removes Fame, so under FAME-21 it cannot. | UNRESOLVED (U-01; confirm) | — | — |
| FAME-23 | Whether Fame keeps accumulating at Renown 12, and whether Fame has any other use. | UNRESOLVED (U-01) | — | — |
| FAME-24 | Renown governs which Tavern ranks are unlocked and their probabilities ([07](07-tavern-economy.md) ECO-23). It is the "player level" for shop odds. | UNRESOLVED (U-03): the owner's approved rank-unlock table was not recorded, and neither was its index (Renown or Round) | — | D-025 |
| FAME-25 | When a Renown increase takes effect: immediately (during preparation) or from the next Round. | UNRESOLVED (U-01) | — | — |

**Conflict resolved by the owner's latest statement.**
- `docs/GAMEPLAY/ECONOMY.md` and `docs/GLOSSARY.md` said "Renown begins at 1". That was undated design prose, never registered in `docs/DECISIONS.md`.
- The owner's 2026-10-12 brief states that Renown starts at 3. It is recorded as D-023, which supersedes "begins at 1". The older files now point here.
- U-05 asks the owner to confirm this supersession.
- The prototype's fielding limit of 3 (P-020) happens to equal the starting Renown. The prototype does not implement Renown, so this changes nothing in the code.

## 3. Fielding capacity — executable rule

```
fieldingCapacity(player) = player.renown            # 3 ≤ renown ≤ 12 (FAME-20)

validFormation(player, formation):
  |formation| ≤ fieldingCapacity(player)
  |formation| ≥ MIN_FIELDED                          # UNRESOLVED (U-25); prototype uses 1
  each fielded Champion is owned, placed once, in a legal, distinct slot ([03] CMB-03)
```

**Edge cases.**
- If capacity could fall below the number already placed (only possible if Renown can decrease, FAME-22), the handling is UNRESOLVED.
- With Renown 12 and 12 owned Champions (the cap, ECO-40), every owned Champion can be fielded. The 12-slot board (CMB-03) fits exactly 12.

**Worked example.** No Fame thresholds are recorded, so this uses only the start value. A new player has Renown 3 and may field up to 3 Champions. Placing a 4th is rejected with "At most 3 Champions can be fielded", and the state is unchanged.

## 4. Required tests (when implemented)

- Renown starts at 3, never exceeds 12, and never falls below 3.
- Fielding is refused above Renown, and the state is unchanged.
- Renown is computed from the configured threshold table only. The table is validated: strictly increasing, one entry per level from 4 to 12, whole numbers.
- "Play my song": exactly −4 Gold and +4 Fame. It is rejected with 3 Gold and leaves the state unchanged. Renown is recomputed after it.
- Round Fame rewards are applied exactly once per Round, from the configured table.
