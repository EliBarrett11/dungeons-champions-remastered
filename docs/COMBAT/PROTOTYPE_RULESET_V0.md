# Prototype Combat Ruleset v0

**Status:** PROVISIONAL. Approved by the project owner on 2026-10-11 as provisional prototype rules (decisions P-001 to P-010 in `docs/DECISIONS.md`).

**What PROVISIONAL means here**
- These rules may be implemented in the first prototype milestone (M1, headless deterministic duel).
- They are **not** CONFIRMED final game rules. Every number below must live in configuration, not be hard-coded across engine logic.
- They may be changed after simulation or playtesting; any change goes through `docs/DECISIONS.md`.
- Where this file conflicts with a CONFIRMED rule, the CONFIRMED rule wins and the conflict must be reported.

Section 11 lists the precise interpretations chosen while writing the approved decisions down. They are marked **INTERPRETATION** and need owner confirmation before or during M1; an implementer should follow them but must not extend them.

## 1. Authority (P-001)
- The master development package (root `README.md`, `CLAUDE.md`, and `docs/`) is authoritative.
- `docs/proposals/0001-initial-plan.md` is SUPERSEDED. It remains for history only; where it disagrees with this package (e.g. turn-based combat, zod schemas, hex board, milestone numbering) it does not apply.

## 2. Combat clock (P-002)
- Combat is a timed, event-scheduled simulation on an **integer-millisecond** timeline.
- There is no frame rate in the simulation. Rendering, animation and browser performance must never affect outcomes.
- The engine advances from one scheduled timestamp to the next; it does not tick at a fixed rate.

## 3. Board and targeting (P-003)
- Each side has a fixed fan-shaped formation of 12 slots: front row 3, middle row 4, back row 5.
- Champions do not move during combat.
- **Basic Attack targeting (prototype only):** attack the enemy Champion in the frontmost occupied enemy row; within that row choose the lowest slot index. Keep that target until it is defeated, then select again with the same rule.
- No attack ranges and no role-priority targeting in the prototype. A role-priority table is a later decision.

## 4. Hit roll (P-004)
- Roll `d20 + Accuracy`. The attack hits if the total is **greater than or equal to** `10 + Evasion` (the target's AC).
- Natural 1 always misses. Natural 20 always hits and is a critical hit (CONFIRMED C-012).
- For standard Champions, only a natural 20 is a critical hit.
- Rogue and Sorcerer critical rules (C-013 to C-017) are CONFIRMED but excluded from M1.

## 5. Damage, critical hits, mitigation and rounding (P-005)
For each damage component, in this order:
1. `base = dice roll + (scaling stat × scaling ratio)`
2. On a critical hit: `base × 2` (whole pre-mitigation amount; standard critical multiplier, PROVISIONAL).
3. Physical damage (Bludgeoning, Piercing, Slashing): `× 100 / (100 + max(0, Armor))`.
4. Overtime multiplier (section 7), if active.
5. Round down once, at the end of the component.
6. A component of an attack that hit deals at least 1 damage.

M1 uses one physical damage type only. Magic Resistance, other damage types, resistances, vulnerabilities, immunities and shields are out of scope for M1.

## 6. Initiative (P-008)
- Each Champion's initiative **total** is `d20 + Initiative Modifier`.
- Ranking is across **all Champions in the battle** (both teams together).
- Opening bonus Ultimate: the Champion(s) with the highest total (CONFIRMED C-001, C-002). Ultimates are excluded from M1, so M1 only records the result in the event log.
- Bottom half: let `N` be the number of Champions in the battle and `k = floor(N / 2)`. The `k` lowest totals skip their first Basic Attack.
- **Boundary ties do not skip.** Formally, a Champion skips if and only if the number of Champions whose total is less than or equal to its own total is at most `k`. (Example: totals 1, 2, 2, 3 → only the Champion with 1 skips. Totals 1, 1, 2, 3 → both Champions with 1 skip. `N = 1` → nobody skips.)
- A skipped first Basic Attack means the first timer cycle completes with no attack.
- Basic Attack timers are independent of initiative (CONFIRMED C-004).

## 7. Defeat, simultaneous attacks, draws and battle end (P-006)
- A Champion is defeated when its Health is 0 or lower. Death saves are not used in the prototype.
- Attacks committed at the same timestamp all resolve, even if one of them defeats another attacker at that timestamp.
- If both teams are fully defeated at the same timestamp, the battle is a draw.
- **Provisional overtime:** after 30 seconds, damage is multiplied by 2, doubling again every 5 seconds.
- **Hard cap:** at 60 seconds the battle stops; if both teams still have a Champion standing, it is a draw.
- The final overtime formula (CONFIRMED intent C-018) remains UNRESOLVED; this schedule exists so every prototype battle terminates.

## 8. Test-unit stats (P-007)
- M1 test units use the Role table in `docs/COMBAT/STAT_MODEL.md` at Rank 1, level 1.
- These are **test fixtures**, not balance values. Rank multipliers and level growth are not applied.

## 9. Random numbers and seeds (P-009)
- All randomness comes from one small, in-repository seeded pseudo-random number generator per battle (sfc32 is the recommended algorithm). Ambient randomness such as `Math.random()` is forbidden in engine code.
- In a full match, each battle's seed is derived from the match seed, the round number and the pairing. In M1 the battle seed is supplied directly by the test.
- The order in which random numbers are consumed must be documented in code and is part of the determinism contract. Changing it is a breaking change to recorded replays.

## 10. Ordering and tie-breaks (P-010)
- Actions due at the same timestamp are ordered by: initiative total (highest first), then team side, then board slot index.
- This replaces the earlier PROPOSED tie-break (instance ID, then board slot; C-011).
- Because same-timestamp attacks resolve from one snapshot (section 7), this ordering governs the order of random-number consumption and event-log entries, not who gets to act.

## 11. Interpretations requiring owner confirmation
These fill gaps that the approved wording did not settle. They are recorded as open questions in `docs/OPEN_QUESTIONS.md` (section "Prototype ruleset interpretations").

| ID | Interpretation chosen | Alternative |
|---|---|---|
| I-1 | Slot indices run front to back, left to right: front row = slots 0, 1, 2; middle row = slots 3, 4, 5, 6; back row = slots 7, 8, 9, 10, 11. | Different numbering; only affects targeting tie-breaks and ordering. |
| I-2 | Basic Attack interval in ms = `round(1000 / attacks per second)`. The first Basic Attack happens at `t = interval` (one full cycle after battle start), and a skipping Champion's first attack happens at `t = 2 × interval`. | Attack at `t = 0`; floor instead of round. |
| I-3 | Overtime multiplier at timestamp `t` (ms): `1` if `t < 30000`; otherwise `2^(1 + floor((t − 30000) / 5000))`. So ×2 from 30 s, ×4 from 35 s, … ×128 from 55 s. | First doubling at 35 s. |
| I-4 | The hard cap fires at exactly `t = 60000`; no action scheduled at or after 60000 ms resolves. | Resolve actions at 60000 first, then stop. |
| I-5 | Team side order for P-010: the team listed first in the battle input ("side A") before "side B". | Side order chosen by seed. |
| I-6 | Random-number consumption order: initiative rolls first, in side A then side B, slot index ascending; then, per resolved attack, the d20 followed by each damage component's dice in component order. A critical hit multiplies; it does not roll extra dice. | Rolling extra dice on a critical hit (tabletop style). |
| I-7 | Test units without an initiative modifier in `STAT_MODEL.md` use `+0`. | Assign per-role modifiers. |
| I-8 | When a target is defeated, attacks against it scheduled at later timestamps retarget using section 3 at commit time. | Attack is lost. |
| I-9 | Floating-point arithmetic is allowed for intermediate damage values, but only `+ − × ÷` and `floor`; no transcendental functions (`Math.pow` with non-integer exponents, `Math.log`, etc.) in outcome-affecting code. | Integer/basis-point arithmetic throughout. |

## 12. Out of scope for M1
Ultimates (beyond recording the opening winner), Class Resources, Rogue/Sorcerer critical rules, status effects, effects from the catalogue, saving throws, death saves, Magic Resistance and non-physical damage types, Traits, Items, levels, Feats, economy, shop, players, UI and networking.
