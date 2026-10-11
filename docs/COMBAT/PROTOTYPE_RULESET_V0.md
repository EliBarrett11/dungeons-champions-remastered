# Prototype Combat Ruleset v0

**Status:** PROVISIONAL. Approved by the project owner on 2026-10-11 as provisional prototype rules: decisions P-001 to P-016 and accepted interpretations I-1 to I-9 in `docs/DECISIONS.md`.

**What PROVISIONAL means here**
- These rules may be implemented in the first prototype milestone (M1, headless deterministic duel) and, for the Ultimate parts of P-011 and P-013, in the later Ultimate milestone.
- They are **not** CONFIRMED final game rules. Every number below must live in configuration, not be hard-coded across engine logic.
- They may be changed after simulation or playtesting; any change goes through `docs/DECISIONS.md`.
- Where this file conflicts with a CONFIRMED rule, the CONFIRMED rule wins and the conflict must be reported. The single exception is the Basic Attack pause in C-009, which the owner explicitly superseded with P-011 (section 11).
- An implementer must follow these rules as written and must not extend them.

## 1. Authority (P-001)
- The master development package (root `README.md`, `CLAUDE.md`, and `docs/`) is authoritative.
- `docs/proposals/0001-initial-plan.md` is SUPERSEDED. It remains for history only; where it disagrees with this package (e.g. turn-based combat, zod schemas, hex board, milestone numbering) it does not apply.

## 2. Combat clock (P-002)
- Combat is a timed, event-scheduled simulation on an **integer-millisecond** timeline.
- There is no frame rate in the simulation. Rendering, animation and browser performance must never affect outcomes.
- The engine advances from one scheduled timestamp to the next; it does not tick at a fixed rate.

### 2.1 Basic Attack intervals (I-2)
- Attack speed (attacks per second) must be greater than zero.
- Interval in ms = `round(1000 / attacks_per_second)`, with halves rounded up, and never less than 1 ms. Section 5.1 gives the exact integer computation.
- The first Basic Attack happens one full interval after battle start (`t = interval`), then every interval after that.
- A Champion that skips its first Basic Attack (section 6) waits through the first interval without attacking, then waits another full interval: its first actual attack is at `t = 2 × interval`.
- Basic Attack timers are never paused by Ultimates (section 11).

## 3. Board and targeting (P-003, P-016; I-1, I-8)
- Each side has a fixed fan-shaped formation of 12 slots: front row 3, middle row 4, back row 5.
- **Slot numbering (I-1):** front row = slots 0, 1, 2; middle row = slots 3, 4, 5, 6; back row = slots 7, 8, 9, 10, 11. Within each row, slots are numbered left to right.
- Champions do not move during combat.
- **Basic Attack targeting (prototype only):** attack the enemy Champion in the frontmost occupied enemy row; within that row choose the lowest slot index. Keep that target until it is defeated, then select again with the same rule.
- **Occupied (P-016):** for targeting, a slot is occupied only if it holds a non-defeated Champion. Defeated Champions are never selected as new targets, and a row containing only defeated Champions counts as unoccupied.
- **Target switching (I-8):**
  - If the current target was defeated at an earlier timestamp, a new target is selected, using the rule above, when the attacker's next attack is committed.
  - An attack already committed at a timestamp keeps its original target, even if that target is defeated by another action at the same timestamp, including an Ultimate that resolves before it (sections 7 and 11.1).
  - If no enemy Champion is alive when an attack would be committed, no attack is committed or performed. Enemies defeated after commitment at the same timestamp do not cancel an already committed attack.
- No attack ranges and no role-priority targeting in the prototype. A role-priority table is a later decision.

## 4. Hit roll (P-004)
- Roll `d20 + Accuracy`. The attack hits if the total is **greater than or equal to** `10 + Evasion` (the target's AC).
- Natural 1 always misses. Natural 20 always hits and is a critical hit (CONFIRMED C-012).
- For standard Champions, only a natural 20 is a critical hit.
- Rogue and Sorcerer critical rules (C-013 to C-017) are CONFIRMED but excluded from M1.

## 5. Damage, critical hits, mitigation and rounding (P-005)
For each damage component, in this order:
1. `base = dice roll + (scaling stat × scaling ratio)`
2. On a critical hit: `base × 2`. The whole pre-mitigation amount is multiplied; no extra dice are rolled (I-6). The ×2 is the standard critical multiplier, PROVISIONAL.
3. Physical damage (Bludgeoning, Piercing, Slashing): `× 100 / (100 + max(0, Armor))`.
4. Overtime multiplier (section 7), if active.
5. Round down once, at the end of the component.
6. A component of an attack that hit deals at least 1 damage.

M1 uses one physical damage type only. Magic Resistance, other damage types, resistances, vulnerabilities, immunities and shields are out of scope for M1.

### 5.1 Deterministic arithmetic (I-9)
Authoritative combat state never uses uncontrolled floating-point arithmetic. Equivalent inputs must always produce the same result.
- **Integer inputs.** Health, Attack, Spell Power, Armor, Magic Resistance, Accuracy, Evasion, Initiative Modifier, dice results and timestamps are integers.
- **Attack speed** is represented as an integer number of thousandths of an attack per second (`a`; e.g. 0.65 → 650). Values that are not exact to three decimal places are rejected by configuration/content validation. The interval is `max(1, floor((2 × 1,000,000 + a) / (2 × a)))` ms, which equals `round(1000 / attacks_per_second)` with halves rounded up.
- **Scaling ratios** are represented as exact integers in basis points (`r`, ten-thousandths; e.g. 1 → 10,000, 0.25 → 2,500). Ratios that are not exact in basis points are rejected by configuration/content validation.
- **Damage component as an exact fraction.** Each component is carried as an integer numerator `n` over an integer denominator `d`, and divided only once at the end:
  1. `n = dice × 10,000 + stat × r`, `d = 10,000`
  2. critical hit: `n = n × 2`
  3. physical mitigation: `n = n × 100`, `d = d × (100 + max(0, Armor))`
  4. overtime: `n = n × multiplier` (an integer power of two, section 7)
  5. result = `floor(n / d)` (mathematical floor, toward negative infinity), then at least 1 if the attack hit.
- Intermediate values must stay within the exact-integer range of the implementation; the engine must use arbitrary-precision integers or assert the range rather than lose precision.
- No transcendental functions (logarithms, non-integer powers, etc.) in outcome-affecting code.

## 6. Initiative (P-008; I-7)
- Each Champion's initiative **total** is `d20 + Initiative Modifier`.
- Ranking is across **all Champions in the battle** (both teams together).
- Opening bonus Ultimate: the Champion(s) with the highest total (CONFIRMED C-001, C-002). Ultimates are excluded from M1, so M1 only records the result in the event log.
- Bottom half: let `N` be the number of Champions in the battle and `k = floor(N / 2)`. The `k` lowest totals skip their first Basic Attack.
- **Boundary ties do not skip.** Formally, a Champion skips if and only if the number of Champions whose total is less than or equal to its own total is at most `k`. (Example: totals 1, 2, 2, 3 → only the Champion with 1 skips. Totals 1, 1, 2, 3 → both Champions with 1 skip. `N = 1` → nobody skips.)
- A skipped first Basic Attack means the first timer cycle completes with no attack (timing in section 2.1).
- Basic Attack timers are independent of initiative (CONFIRMED C-004).

## 7. Defeat, simultaneous attacks, draws and battle end (P-006, P-012; I-3, I-4)
- A Champion is defeated when its Health reaches 0. Death saves are not used in the prototype.
- **Defeated attackers (P-016):** a defeated Champion cannot commit new Basic Attacks at any later moment. A Basic Attack it committed before it was defeated still resolves with its stored outcome and original target (below and section 11.1).
- **Health clamping (P-012):**
  - A Champion's authoritative Health never falls below 0. When damage would reduce Health below 0, Health is set to 0.
  - Damage beyond the Health remaining at the moment it is applied is **excess damage**. It may be recorded in the combat event log for debugging or analysis, as a value separate from Health (for example: damage computed, Health removed, excess damage). It never produces negative Health in state or in any Health value in the log.
  - Clamping applies to all damage resolution, including damage from committed Basic Attacks and from Ultimates.
  - Clamping never cancels another attack already committed at the same timestamp.
- **Committed attacks:** attacks committed at the same timestamp all resolve, even if the attacker or the target is defeated at that timestamp after commitment. Commitment fixes each attack's target and inputs and stores its rolled dice and, on a hit, its calculated damage (sections 9.3 and 11.1). Health changes only at resolution. Committed attacks are not cancelled, retargeted or re-rolled.
- Committed Basic Attacks at a timestamp are applied one after another in the P-010 order (section 10). Their inputs were fixed at commitment, and Health only decreases (no healing in the prototype), so the final Health of every Champion is the same as if all of them were applied at once (CONFIRMED C-005). The order only decides how excess damage is attributed and the order of log entries.
- The battle result is decided after every action at the timestamp has resolved. If both teams are fully defeated at the same timestamp, the battle is a draw.
- **Provisional overtime (I-3):** the damage multiplier at timestamp `t` (ms) is
  - `1` if `t < 30,000`;
  - otherwise `2^(1 + floor((t − 30,000) / 5,000))`.

  | Timestamp (ms) | Multiplier |
  |---|---|
  | 0 – 29,999 | ×1 |
  | 30,000 – 34,999 | ×2 |
  | 35,000 – 39,999 | ×4 |
  | 40,000 – 44,999 | ×8 |
  | 45,000 – 49,999 | ×16 |
  | 50,000 – 54,999 | ×32 |
  | 55,000 – 59,999 | ×64 |

- **Hard stop (I-4):** the battle stops at `t = 60,000` **before** any combat action scheduled at that timestamp resolves. Actions scheduled after the cutoff never resolve either. If both teams still have a Champion standing, the battle is a draw. ×128 is therefore never applied.
- The final overtime formula (CONFIRMED intent C-018) remains UNRESOLVED; this schedule exists so every prototype battle terminates.

## 8. Test-unit stats and fixture Basic Attack (P-007, P-015; I-7)
- M1 test units use the Role table in `docs/COMBAT/STAT_MODEL.md` at Rank 1, level 1.
- These are **test fixtures**, not balance values. Rank multipliers and level growth are not applied.
- **Battle-level tests** (for example the golden replay and the 1,000 seeded battles) use these Role-table stats. **Focused unit tests** may use custom stat blocks so that edge cases have exact expected results (P-015).
- **Shared fixture Basic Attack (P-015):** every M1 test unit uses one placeholder Basic Attack: dice expression `1d8` (flat bonus 0), scaling stat Attack, scaling ratio 1.0 (10,000 basis points, section 5.1), physical damage. Its base damage amount (section 5, step 1) is `1d8 + Attack × 1.0`. The existing section 5 rules then apply, in order: critical hit ×2, Armor mitigation, overtime multiplier, one round-down, and the minimum of 1 damage on a hit. All physical types use the same Armor mitigation in M1, so no specific physical subtype is required. This is test-fixture data only, not the Basic Attack of any real Champion.
- **Initiative modifier (I-7):** a missing Initiative Modifier defaults to `+0`. This default applies to prototype test fixtures only, not to authored Champion content.

## 9. Random numbers and seeds (P-009; I-5, I-6)
- All randomness comes from one small, in-repository seeded pseudo-random number generator per battle (sfc32 is the recommended algorithm). Ambient randomness such as `Math.random()` is forbidden in engine code.
- In a full match, each battle's seed is derived from the match seed, the round number and the pairing. In M1 the battle seed is supplied directly by the test.
- The order in which random numbers are consumed is part of the determinism contract. Changing it is a breaking change to recorded replays.
- The method that turns a generator output into a die result (for example, rejection sampling) must be fixed, documented in code and covered by tests; it is part of the same contract.

### 9.1 Side assignment (I-5)
- The battle input lists two participants in a fixed order: participant 0 and participant 1.
- The **first** output drawn from the battle's generator is a 32-bit unsigned integer `u`.
- If `u` is even, participant 0 is side A and participant 1 is side B. If `u` is odd, participant 1 is side A and participant 0 is side B.
- The assignment is fixed for the whole battle and recorded in the event log.
- This makes side assignment reproducible for a given seed without permanently favouring whichever participant is listed first.

### 9.2 Consumption order (I-6, P-014)
Every random number comes from the battle's generator in exactly this order. Nothing else draws from it.
1. **Battle start: side assignment.** One draw (section 9.1).
2. **Battle start: initiative.** One d20 per Champion, side A first, then side B; ascending slot index within each side.
3. **Each timestamp `t` before the 60,000 ms hard stop, in ascending order of `t`.** Draws happen in the three P-013 stages (section 11.1):
   1. **Commitment stage.** The eligible Basic Attacks are committed one at a time, in the P-010 order (section 10). For each attack, in this order:
      1. select and store its target (section 3); no draw;
      2. draw one d20 for the attack roll;
      3. decide hit or miss and critical hit from that natural roll and the inputs fixed at commitment (section 4); no draw;
      4. if the attack hits, draw the damage dice of each damage component, in component order and die by die; if it misses, draw no damage dice;
      5. on a hit, calculate each component's complete damage (section 5); no draw;
      6. store the attack's outcome (section 9.3). Health is not changed at commitment.
   2. **Ultimate stage.** Any random numbers a ready Ultimate needs are drawn while it resolves, in the Ultimate resolution order. These draws always come after every commitment-stage draw at `t`. What an Ultimate draws is defined by its ability; none is defined yet.
   3. **Basic Attack resolution stage.** No draws. Each committed attack applies its stored damage to the target's current Health, with P-012 clamping.
4. Critical hits multiply the entire pre-mitigation amount by the provisional ×2 (section 5); they never draw additional dice in M1.
5. A Basic Attack that is not committed draws nothing. This covers a skipped first attack (section 6), the case where no enemy is alive (section 3), an attacker already defeated at an earlier moment (section 7, P-016), and anything at or after the hard stop (section 7).

The P-010 order only decides which random numbers each attack receives and the order of event-log entries. It gives no attack an advantage in who acts first, because every committed attack's target, inputs, dice and calculated damage are fixed at commitment.

### 9.3 Stored attack outcome (P-014)
Approved by the owner (Option A). PROVISIONAL.
- When a Basic Attack is committed, its target is stored and its d20 is rolled (section 9.2). Hit or miss and critical hit are decided from that natural roll and the inputs fixed at commitment (section 4).
- **On a hit**, all of the attack's damage dice are rolled at commitment. The complete damage of each component is calculated then, using section 5 (steps 1–6: base, critical ×2, Armor mitigation, overtime multiplier, one round-down, minimum 1) and the inputs fixed at commitment (section 11.1). That damage is stored.
- **On a miss**, no damage dice are rolled (I-6) and no damage is stored.
- The stored outcome is: the target, the natural d20, the hit/miss result, the critical result, each damage die result, and, on a hit, each component's calculated damage.
- Committing an attack never changes Health. The stored damage is applied to the target's current Health only when the committed attack resolves (section 11.1, step 4), with P-012 clamping. Excess damage is determined at that point.
- Nothing that happens between commitment and resolution at the same timestamp can re-roll, alter or replace a stored outcome. This includes a ready Ultimate resolving, any Ultimate's own random draws, and the defeat of the attacker or the target.
- The existing rules for defeated attackers and targets are unchanged. A committed attack still resolves with its stored outcome against its original target (sections 3 and 7, P-006, P-013).

## 10. Ordering and tie-breaks (P-010)
- Actions due at the same timestamp are ordered by: initiative total (highest first), then team side (side A before side B, as assigned in section 9.1), then board slot index (ascending).
- This replaces the earlier PROPOSED tie-break (instance ID, then board slot; C-011).
- Because committed attacks keep the target, inputs and dice fixed at commitment (sections 7 and 9.3), this ordering governs the order of random-number consumption (section 9.2), excess-damage attribution and event-log entries, not who gets to act.
- Ultimates ready at the same timestamp use this same ordering among themselves and resolve before committed Basic Attacks (section 11.1).

## 11. Ultimate timing (P-011)
Approved by the owner as "A + Visual only". PROVISIONAL. It supersedes the Basic Attack pause in C-009. Ultimates are outside M1; this rule binds the later Ultimate milestone.
1. Basic Attack timers keep progressing while Ultimates activate and resolve.
2. An Ultimate activates and resolves immediately, at the timestamp its resource reaches its target, unless the ability explicitly defines a cast time.
3. An Ultimate never pauses the caster's or any other Champion's Basic Attack timer.
4. Ultimate animations are presentation only. Animation duration never advances, delays or pauses the authoritative simulation.
5. A future ability may define an explicit cast time without pausing the battle. No cast-time or interruption system is defined for M1, and none may be invented from this rule.
6. Simultaneous actions are handled deterministically (sections 7, 10 and 11.1). Deterministic ordering is never a reason to pause Basic Attack timers.
7. Unchanged and still in force:
   - the opening bonus Ultimate (C-001, C-002, C-008);
   - immediate triggering and reset of the Class Resource to zero with no carry-over, at trigger time (C-007);
   - ordering of simultaneously ready Ultimates by descending initiative, with caster and target rechecked before each resolves (C-010; tie-breaks per P-010).

### 11.1 Same-timestamp resolution: Ultimates first (P-013)
Approved by the owner. PROVISIONAL. Ready Ultimates resolve before committed Basic Attacks at the same simulation timestamp. **Commitment and resolution are separate stages.** At each timestamp `t` before the 60,000 ms hard stop (section 7):
1. **Identify** the eligible actions: ready Ultimates, and Basic Attacks of non-defeated Champions whose timers expire at `t` (a Champion defeated at an earlier moment commits nothing, P-016).
2. **Commit** every eligible Basic Attack before any action at `t` resolves. Commitment fixes the attack's target (section 3) and its inputs under the existing rules: attacker and target stats as they stand at the start of `t`, and the overtime multiplier for `t`. It also rolls the attack's d20 and, on a hit, its damage dice, calculates the hit's complete damage, and stores the outcome without changing any Health (P-014, sections 9.2 and 9.3).
3. **Resolve ready Ultimates**, one at a time, in the deterministic order of C-010 and P-010. Before each one resolves, recheck caster and target validity as C-010 requires. What happens when a check fails is still PROPOSED (`RESOLUTION_CONTRACT.md` section 6). Each Ultimate sees the battle as left by the Ultimates before it.
4. **Resolve committed Basic Attacks** after the ready Ultimates, in the P-010 order, using the target, inputs and stored outcome from step 2. No dice are rolled in this step, and the Ultimates resolved in step 3 cannot change any stored outcome.
5. A committed Basic Attack keeps its original target even if that target is defeated by an Ultimate or another action at `t`.
6. A committed Basic Attack is not cancelled because its attacker is defeated after commitment at `t`. No existing CONFIRMED rule requires cancellation.
7. Health clamping (P-012) applies to every damage application in steps 3 and 4.
8. Steps 1–4 take no simulated time. No animation, Ultimate activation or resolution step pauses the simulation clock or any Basic Attack timer (P-011).

The battle result is decided after step 4 (section 7). An Ultimate's resource reset happens when it triggers (C-007) and is unaffected by this ordering.

Open points P-011 and P-013 do not settle are listed in `docs/OPEN_QUESTIONS.md` (Combat). These include Ultimates that become ready during step 3 or step 4 at the same timestamp. When committed Basic Attacks draw their random numbers is settled by P-014 (section 9.2).

## 12. Accepted interpretations register
The owner accepted all nine interpretations on 2026-10-11. Each is PROVISIONAL with the same standing as P-001 to P-016.

| ID | Subject | Recorded in |
|---|---|---|
| I-1 | Board slot numbering | Section 3 |
| I-2 | Basic Attack intervals and first-attack timing | Section 2.1 |
| I-3 | Overtime multiplier schedule | Section 7 |
| I-4 | Hard stop at 60,000 ms | Section 7 |
| I-5 | Seeded side assignment | Section 9.1 |
| I-6 | Random-number consumption order; critical hits multiply, no extra dice | Sections 5 and 9.2 (extended by P-014) |
| I-7 | Test-unit Initiative Modifier default +0 | Sections 6 and 8 |
| I-8 | Target switching and committed targets | Section 3 |
| I-9 | Deterministic integer arithmetic | Section 5.1 |

## 13. Out of scope for M1
Ultimates (beyond recording the opening winner), Class Resources, Rogue/Sorcerer critical rules, status effects, effects from the catalogue, saving throws, death saves, Magic Resistance and non-physical damage types, Traits, Items, levels, Feats, economy, shop, players, UI and networking.
