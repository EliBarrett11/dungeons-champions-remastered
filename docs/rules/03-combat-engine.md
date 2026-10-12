# 03 — Combat Engine

Tags and conventions: see [00 — Index](00-INDEX.md).

**Canonical sources.**
- `docs/COMBAT/PROTOTYPE_RULESET_V0.md` ("Ruleset" below; § = its sections) holds the exact implemented rules.
- `docs/COMBAT/RESOLUTION_CONTRACT.md` ("Contract") holds the full-game design, mostly PROPOSED.

This rulebook maps every combat mechanic to those sources and to the code. It adds a worked example and the test map. It does not restate the formulas; follow the § links.

All tunables live in `M1_CONFIG` (`packages/engine/src/config.ts`). Short code paths below (for example `battle/run.ts`) are relative to `packages/engine/src/`.

## 1. Scope today

- **Implemented (M1, PROVISIONAL rules):** Basic Attacks only, physical damage, 1–5 units per side.
- **Not implemented:** Ultimates (the opening winner is only recorded), Class Resources, Rogue and Sorcerer critical rules, statuses, effects, saving throws, death saves, Magic Resistance, non-physical damage, Traits, Items, levels and Feats (Ruleset §13).

The prototype Expedition uses this engine unchanged (P-022). A full 12-Champion team (D-019) needs `maxUnitsPerSide` raised from 5. That is a configuration change, but it needs an owner decision, because 5 is the M1 scope (U-25).

## 2. Mechanic map

| ID | Mechanic | Rule (summary) | Design status | Implementation | Canonical detail |
|---|---|---|---|---|---|
| CMB-01 | Combat clock | Event-scheduled, integer-millisecond timeline; no frame rate; animations never affect outcomes. | PROVISIONAL (P-002, P-011) | IMPLEMENTED `battle/schedule.ts`, `battle/run.ts` | Ruleset §2 |
| CMB-02 | Attack interval | `interval = max(1, floor((2,000,000 + a) / (2a)))` ms, where `a` is attack speed in thousandths. First attack at `interval`; a skipped first attack moves the first real attack to `2 × interval`. | PROVISIONAL (I-2, I-9) | IMPLEMENTED `rules/interval.ts` | Ruleset §2.1, §5.1 |
| CMB-03 | Board | 12 slots per side: front 0–2, middle 3–6, back 7–11. No movement. | PROVISIONAL (P-003, I-1) | IMPLEMENTED `rules/targeting.ts`, `M1_CONFIG.boardRowStartSlots` | Ruleset §3 |
| CMB-04 | Targeting | Frontmost row that holds a living enemy, then its lowest slot. The target is kept until defeated. A new target is chosen when the next attack is committed. Defeated units never occupy a slot. With no living enemy, no attack is made. | PROVISIONAL (P-003, P-016, I-8) | IMPLEMENTED `rules/targeting.ts` | Ruleset §3 |
| CMB-05 | Initiative | Total = `d20 + Initiative Modifier`, ranked across both teams. With `k = floor(N/2)`, a Champion skips its first Basic Attack iff the number of Champions with total ≤ its own is ≤ `k`. Ties at the boundary do not skip. The highest total(s) win the opening Ultimate (C-001, C-002). M1 only records the winner. | APPROVED DESIGN (C-001 to C-004); boundary rule PROVISIONAL (P-008) | IMPLEMENTED `rules/initiative.ts` (opening Ultimate recorded, not executed) | Ruleset §6 |
| CMB-06 | Hit roll | Hit iff `d20 + Accuracy ≥ 10 + Evasion`. Natural 1 always misses; natural 20 always hits and crits. | APPROVED DESIGN (C-012); formula PROVISIONAL (P-004) | IMPLEMENTED `rules/hit.ts` | Ruleset §4 |
| CMB-07 | Damage | Per component: `base = dice total (incl. K) + stat × ratio`; crit ×2 on the whole base; physical mitigation `×100/(100+max(0, Armor))`; overtime multiplier; floor once; minimum 1 on a hit. Exact fraction arithmetic. | PROVISIONAL (P-005, P-017, I-9); C-019 PROPOSED as a final rule | IMPLEMENTED `rules/damage.ts` (BigInt) | Ruleset §5, §5.1 |
| CMB-08 | Health and defeat | Health is clamped at 0. Excess damage is logged separately. A Champion at 0 is defeated. No death saves. | PROVISIONAL (P-006, P-012) | IMPLEMENTED `battle/run.ts`, event `unitDefeated` | Ruleset §7 |
| CMB-09 | Same-timestamp resolution | (1) identify; (2) commit every due Basic Attack (target fixed, d20 and damage dice rolled, damage computed and stored); (3) resolve ready Ultimates; (4) apply stored Basic Attacks. Commitment never changes Health. Committed attacks are never cancelled or retargeted. | APPROVED DESIGN (C-005); stages PROVISIONAL (P-013, P-014, P-016) | IMPLEMENTED `battle/run.ts` (step 3 is empty: no Ultimates yet) | Ruleset §7, §9.2, §9.3, §11.1 |
| CMB-10 | Tie ordering | Same-timestamp actions are ordered by initiative total (descending), then side A before side B, then slot (ascending). | PROVISIONAL (P-010) | IMPLEMENTED `rules/ordering.ts` | Ruleset §10 |
| CMB-11 | Overtime | ×1 before 30,000 ms; then `2^(1 + floor((t − 30,000)/5,000))`. | APPROVED DESIGN intent (C-018); schedule PROVISIONAL (P-006, I-3) | IMPLEMENTED `rules/overtime.ts` | Ruleset §7 |
| CMB-12 | Battle end | The result is decided after every action at a timestamp has resolved. One side wiped = win. Both wiped at once = draw. At `t = 60,000` the battle stops before any action at that timestamp resolves: draw. | PROVISIONAL (P-006, I-4) | IMPLEMENTED `battle/run.ts`, event `battleEnd` | Ruleset §7 |
| CMB-13 | Side assignment | First generator output `u`: even → participant 0 is side A; odd → participant 1 is side A. | PROVISIONAL (I-5) | IMPLEMENTED `rng/sides.ts` | Ruleset §9.1 |
| CMB-14 | Random order | Sides, then initiative (side A then B, slot ascending), then per timestamp each committed attack's d20 and, on a hit only, its damage dice. Nothing is drawn at resolution. | PROVISIONAL (I-6, P-014) | IMPLEMENTED `battle/run.ts`, `rng/dice.ts` | Ruleset §9.2 |
| CMB-15 | Ultimate timing | Resolves at the trigger timestamp. Never pauses any Basic Attack timer. Animation is presentation only. Resource resets to 0 with no carry-over. | APPROVED DESIGN (C-007, C-008, C-010); timing PROVISIONAL (P-011, P-013) | NOT IMPLEMENTED | Ruleset §11 |
| CMB-16 | Class Resources | Filled by class-specific events (for example, Barbarian Rage on taking damage). Rules for the 12 other Classes are missing. | APPROVED DESIGN principle (C-006); details UNRESOLVED (U-18) | NOT IMPLEMENTED | Contract §6 |
| CMB-17 | Rogue / Sorcerer crits | Rogue crits on natural 16–20 and gains resource once per qualifying crit. Sorcerer: natural 1–2 miss; 19–20 crit only if the attack otherwise hits; natural 20 always hits and crits. Rogue multiplier 1.5× PROPOSED. | APPROVED DESIGN (C-013 range and resource, C-014 to C-017) | NOT IMPLEMENTED | Contract §3 |
| CMB-18 | Damage types | 13 types. Each should have a mechanical identity, but none applies a status automatically. | APPROVED DESIGN (D-014); per-type mechanics UNRESOLVED (U-30) | NOT IMPLEMENTED (physical only) | Contract §7 |
| CMB-19 | Control, saves, statuses | Control must have duration caps, boss resistance and diminishing returns. Six saving-throw attributes are PROPOSED (C-020). | APPROVED DESIGN requirement (C-021); values UNRESOLVED (U-30) | NOT IMPLEMENTED | Contract §5–§6 |
| CMB-20 | Resolution windows and recursion limits | Named windows (pre_action … battle_end) and recursion safeguards. | PROPOSED | NOT IMPLEMENTED | Contract §4, §9 |
| CMB-21 | Persistence of Champion damage between Rounds | Prototype: every battle starts at full Health (R-004). Full game: UNRESOLVED (U-26). | PROVISIONAL (prototype only) | PROTOTYPE `buildBattleInput` | R-004 |

## 3. Resolution loop (pseudocode of the implemented engine)

This mirrors `packages/engine/src/battle/run.ts`. Where it is unclear, the Ruleset sections win.

```
setupBattle(input, seed):
  validate input (validate.ts); invalid → rejected before any draw
  rng ← BattleRng(seed)
  sides ← drawSideAssignment(rng)                      # CMB-13, 1 draw
  for unit in sideA by slot, then sideB by slot:       # CMB-14
      unit.initiative ← rollDie(rng, 20) + unit.initiativeModifier
  mark skippers (CMB-05); record opening-Ultimate winner(s)
  schedule each unit's first timer at interval (skipper: its first cycle performs no attack)

loop over timestamps t in ascending order, while t < 60,000:
  due ← living units whose timer expires at t, sorted by CMB-10
  for unit in due:                                     # commitment stage
      if skipping first attack: log attackSkipped; reschedule; continue
      target ← keep current target if alive, else select (CMB-04); none → no attack
      natural ← rollDie(rng, 20); hit/crit per CMB-06
      if hit: roll damage dice; compute damage per CMB-07 with overtime(t)
      store outcome; log attackCommitted                # Health unchanged
      reschedule unit at t + interval
  (Ultimate stage — none in M1)
  for outcome in committed (same order):               # resolution stage, no draws
      apply stored damage to target (clamp at 0, log excess); log attackResolved
      if target Health = 0 and not yet logged defeated: log unitDefeated
  if a side has no living unit: end (win, or draw if both)
at t = 60,000: end as a draw before resolving anything at t   # CMB-12
```

## 4. Worked examples

These use the Role-table fixture stats (`docs/COMBAT/STAT_MODEL.md`, P-007) and the fixture Basic Attack `1d8 + Attack × 1.0` (P-015).

**Interval (CMB-02).**
- Tank, 0.65 attacks/s, so `a = 650`: `floor(2,000,650 / 1,300) = 1,538` ms.
- Bruiser, 0.80 attacks/s: 1,250 ms.
- A Bruiser that skips attacks first at 2,500 ms.

**Hit and damage (CMB-06, CMB-07).** A Bruiser (Attack 65, Accuracy +2) attacks a Tank (Armor 60, Evasion +1, so AC 11).
- d20 = 12: total 14 ≥ 11, a hit. d8 = 5.
- `n = (5 + 65) × 10,000 = 700,000`, `d = 10,000`.
- Mitigation: `n = 70,000,000`, `d = 10,000 × 160 = 1,600,000`, so 43.75, floored to **43** damage.
- Same roll at `t = 31,000` (overtime ×2): 87.5, floored to **87**.
- With a natural 20 at `t < 30,000` (crit ×2): `140 × 100 / 160` = 87.5, floored to **87**.
- A natural 1 always misses, whatever the totals. No damage dice are drawn on a miss.

**Initiative skip (CMB-05).** With totals 1, 2, 2, 3 (N = 4, k = 2), only the Champion with total 1 skips. With 1, 1, 2, 3, both 1s skip. With N = 1, nobody skips.

**Simultaneous defeat (CMB-09, CMB-12).** Two units with 1 Health attack each other at the same timestamp, and both hit. Both attacks are committed before either resolves, so both resolve. Both units are defeated, and the battle is a **draw**.

## 5. Invalid input and edge cases

- **Invalid battle input.** Any invalid input is rejected by `validateBattleInput` before any random draw. Examples: units per side outside 1–5, an illegal or duplicate slot, attack speed ≤ 0 or not a whole number of thousandths, a ratio not in whole basis points, a stat beyond the safety limits, a bad dice expression.
- **Excess damage.** It is reported separately and never makes Health negative.
- **Defeated attacker.** A Champion defeated at an earlier timestamp commits nothing and draws nothing. An attack it committed at the same timestamp still resolves.
- **Hard stop.** An action scheduled at exactly 60,000 ms never resolves. ×128 is never applied.

## 6. Required tests

**Existing tests (must keep passing).** All are in `packages/engine/test/`:
- `rules.interval`, `rules.initiative`, `rules.hit`, `rules.damage`, `rules.overtime`, `rules.ordering`;
- `schedule-targeting`, `battle`, `rng.sfc32`, `rng.dice`, `rng.sides`, `dice.parse`, `validate`, `setup`;
- `serialize`, `replay` (100 identical runs), `golden` (three golden replays), `smoke` (1,000 seeded battles), `purity`.

**Required before Ultimates ship (M5 list in `docs/IMPLEMENTATION/ROADMAP.md`):**
- A committed attack's stored outcome is unchanged by a same-timestamp Ultimate, whether that Ultimate draws zero random numbers or several.
- Ultimate draws come after every commitment draw at that timestamp.
- Defeat rules still hold when an Ultimate defeats the attacker or the target.
- Replays that include Ultimates are reproducible.
