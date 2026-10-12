# 12 — Unresolved Decisions

The owner's decision queue. Each entry says:
- what is missing or contradictory;
- what the records do say;
- which roadmap milestone it blocks (G-numbers: `docs/IMPLEMENTATION/ROADMAP.md`, "Full-game roadmap").

Nothing here may be implemented as a rule until the owner decides it and the decision is recorded in `docs/DECISIONS.md`.

The older detailed lists in `docs/OPEN_QUESTIONS.md` remain valid. Entries below link to them instead of copying them.

**Kinds.**
- **MISSING VALUE**: the owner approved something, but its values are not in any project record.
- **CONFLICT**: two records disagree.
- **UNSPECIFIED**: the rule was never defined.

## 1. Approved, but the values are not recorded (highest priority)

The owner's 2026-10-12 brief describes these as approved, mostly "for testing". The repository was searched for the values:
- the working tree;
- all git history and branches;
- the roster workbooks;
- the session records.

None of the values were found. They must be supplied as tables; they will not be reconstructed by guesswork.

| ID | Kind | Question | What the records say | Blocks |
|---|---|---|---|---|
| U-01 | MISSING VALUE | **Fame → Renown thresholds.** Also: whether Renown can decrease, Fame use at Renown 12, and when a Renown increase takes effect (FAME-21 to FAME-25). | Fame determines Renown; Renown 3 → 12 (D-023). The original audit also found no thresholds. | G1 |
| U-02 | MISSING VALUE | **Round Fame rewards**: the Fame per Round, and whether it depends on the Round type or the outcome (FAME-04 to FAME-06). | A PvE-matched player still gets the baseline Fame (DRAFT). | G1 |
| U-03 | MISSING VALUE | **Tavern rank unlocks and probabilities**: the table, what indexes it (Renown or Round), and whether one Tavern can show the same Champion twice (ECO-23). | Shop odds are said to depend on "player level", which is not defined (`OPEN_QUESTIONS.md`). | G1 |
| U-04 | MISSING VALUE | **Exhausted-rank fallback**: the approved rule text (ECO-24). Also needed: the order in which other ranks are tried, and what happens if all ranks are exhausted (ECO-32). | Approved (D-025), but the text is not recorded. | G1 |

## 2. Conflicts

| ID | Kind | Question | Detail | Blocks |
|---|---|---|---|---|
| U-05 | CONFLICT (recorded, confirm) | **Starting Renown: 3 or 1?** | The owner's 2026-10-12 brief says 3. `GAMEPLAY/ECONOMY.md` and `GLOSSARY.md` said "begins at 1" (undated and unregistered). D-023 records 3 as superseding 1, following the precedent of D-019 (cap 10 → 12). The owner should confirm. | G1 |
| U-07 | CONFLICT (possible) | **Interest and streak Gold alongside the 5 Gold per Round.** | `ECONOMY.md` calls interest `min(5, floor(G/10))` "confirmed", but it is not in the register. The streak schedule is NOT APPROVED. P-032 states only 3 + 5. Are interest and streaks part of the testing baseline, deferred, or dropped? | G1 (Gold), G2 (streaks) |
| U-11 | CONFLICT (structure) | **Monster Round rewards: three bundles, or six Champion options?** | DUNGEON_AND_REWARDS: three bundles of Gold, Components and Champions (DRAFT). D-026: six fresh reserved Champion options per Monster Round. Still to decide: how the six map onto the bundles; what "fresh" excludes; whether the options follow the rank odds; whether reservations are per player or also block other players and the shared pool; whether an eliminated player's reservations are released (MON-22, ECO-31, PVP-52). | G1 (reservations), G8 (bundles) |
| U-34 | CONFLICT (minor) | **Selling.** | D-027: no selling in the initial ruleset. D-012 (CONFIRMED) and CHAMPIONS.md describe what selling does. Read together, selling is a later-ruleset feature. Confirm that D-012's selling clause is dormant until selling is introduced. | none now |

## 3. Economy and progression (unspecified)

| ID | Question | Blocks |
|---|---|---|
| U-06 | When the 5 Gold per Round is paid (start of preparation or after the battle), whether Monster Rounds pay it, and whether Round 1 pays it (ECO-06). Also listed in `OPEN_QUESTIONS.md`. | G1 |
| U-12 | The full-game starting collection: how many Champions, and how they are chosen. The prototype gives 4 random ones. | G1 |
| U-13 | Shared pool: copies per rank; whether pool size varies with player count; combining duplicates; whether the Tavern offers owned Champions; whether a combined copy counts toward the 12 cap; buying at level 10 (CHMP-41, ECO-25, ECO-43; `OPEN_QUESTIONS.md` "Champions and economy"). | G1 (eligibility), G6 |
| U-14 | Eligibility capacity over a 23-Round match: reservations remove 6 Champions per Monster Round (ECO-32). Settled together with U-04 and U-08. | G1 |
| U-27 | Full-game Champion prices per rank. P-024 (price = cost rank) is prototype-only. The cost ranks themselves are PROPOSED (D-021), and the rank odds (U-03) depend on them. | G1 |
| U-28 | "Play my song" limits: uses per preparation phase, use at Renown 12, and whether it is a slot or a separate action. | G1 |
| U-29 | Locking Tavern offers, reroll limits, free rerolls. The prototype has no limit and no lock. Is that the baseline? | G1 |

## 4. Match, PvP and elimination (unspecified)

| ID | Question | Blocks |
|---|---|---|
| U-08 | The Round schedule: how the 23 Rounds divide among the 5 Floors, the type of each Round (only Floor 1 Rounds 1–3 are known), and whether Round numbering is global (MATCH-04, MATCH-13). | G2 |
| U-09 | Match end: if more than one player remains after Round 23; simultaneous final eliminations; placement order (MATCH-31, MATCH-32). | G2 |
| U-10 | The PvP loss-damage formula. The concept is approved (D-028); the candidate stays PROPOSED. Also: H as current or maximum Health; the Floor term; minimum and maximum; damage on a draw; damage after a loss to the odd-player PvE opponent; clamping at 0; any Health restoration (PVP-02, PVP-03, PVP-22 to PVP-24). | G2 |
| U-15 | Consequences of losing, or drawing, a Monster Round in the full game: Health damage, Run end, reward (MON-11). | G2 |
| U-24 | The pairing algorithm, choice of the odd player, whether Monster Rounds count in "the last three Rounds", the PvE replacement's strength formula, and full-match seed derivation (PVP-11 to PVP-13, DET-31, DET-32). | G2 |
| U-33 | Run and streak details: the bonus schedule, carrying across Floors, whether Monster wins count (PVP-31). | G2 |
| U-35 | The order of the resolution steps after a battle: damage, rewards, income, Fame, Renown recomputation, elimination (MATCH-23, flow §1). | G2 |
| U-36 | Preparation timers, ready-up and disconnect behaviour in multiplayer (MATCH-24). | G9 |

## 5. Champions, combat and content (unspecified; detailed lists in `OPEN_QUESTIONS.md`)

| ID | Question | Blocks |
|---|---|---|
| U-16 | The Monster roster, monster stats and abilities, difficulty scaling, and the definition of "last-placed player" (also on Floor 1) (MON-03, MON-04). | G2 (fixtures suffice), G8 |
| U-17 | The canonical stat list and base stats. The Role table is NOT APPROVED. The Role assignments (Fighter/Ranger) need review. The schema's `role` enum must be updated. | G3, G4 |
| U-18 | Class Resources for the 12 Classes without a definition (only Barbarian, Rogue and Sorcerer are described). When the opening Ultimate fires, and what `opening_bonus_ultimate_eligible` means. | G3 |
| U-19 | The mechanics of every Champion kit. All 135 Basic Attack, Passive, Ultimate and Feat texts are PROPOSED (D-021). | G4 |
| U-20 | Trait effects at every bracket, the activation basis (the active field is DRAFT), stacking and timing (TRT-11 to TRT-23). | G5 |
| U-21 | Levels: fielding-progression Rounds per level, whether PvE and PvP Rounds both count, Feat milestone levels and choices, and stat growth (CHMP-40, CHMP-42). | G6 |
| U-22 | Item Components and Items: names, effects, equip UX and stacking (CHMP-63). | G7 |
| U-23 | Routes (count, generation, modifiers, mixed-route PvP), the Run-End Upgrade catalogue and tiers, and the Dragon fight (rules; whether it is one of the 23 Rounds) (MATCH-33, MATCH-42, PVP-41). | G8 |
| U-25 | Full-game fielding: the minimum number fielded, and raising the engine's 5-units-per-side M1 limit to 12 (CMB §1, CHMP-52). | G2 |
| U-26 | Whether Champion damage persists between Rounds in the full game. The prototype restores full Health (R-004). | G2 |
| U-30 | Combat rules beyond Basic Attacks. See `OPEN_QUESTIONS.md` "Combat": Rogue 16–19 on a would-be miss, Sorcerer qualifying events, damage-type mechanics, saving throws, statuses, death saves, Magic Resistance, healing against lethal damage at the same timestamp, Ultimates that become ready mid-resolution, cast times. | G3 |
| U-31 | The schema and content-data issues listed in `OPEN_QUESTIONS.md` ("Schema and content-data issues"). They must be fixed before Champion kits are authored as JSON. | G3, G4 |

## 6. Suggested owner decision pack (G0)

**Unblocks G1.** These can be answered together:
- U-01, U-02, U-03, U-04: supply the tables approved for testing;
- U-05: confirm;
- U-06, U-07, U-12, U-13 (Tavern eligibility only), U-27, U-28, U-29: choose a baseline.

**Unblocks G2.** These come next: U-08, U-09, U-10, U-15, U-24, U-26, U-33, U-35. U-25 needs one detail: the minimum number fielded.

Combat and content decisions (U-17 to U-23, U-30, U-31) can be taken in parallel, Class by Class.
