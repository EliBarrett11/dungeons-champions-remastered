# Progress Ledger

Update this file at the end of each approved milestone.

## Current status
- [x] Existing repository audited by Claude Code.
- [x] Audit established that the full specification package was not in the remote repository.
- [x] Master development package committed to the correct repository (`5398c07`).
- [x] Schema/example validation completed (2026-10-11; results in `OPEN_QUESTIONS.md` → "Schema and content-data issues").
- [x] Documentation reorganised into `docs/` and duplicate documents merged (2026-10-11).
- [x] First-slice combat assumptions approved as PROVISIONAL prototype rules P-001 to P-010 (`DECISIONS.md`, `COMBAT/PROTOTYPE_RULESET_V0.md`).
- [x] Interpretations I-1 to I-9 in `COMBAT/PROTOTYPE_RULESET_V0.md` accepted (2026-10-11).
- [x] Ultimate timing model P-011 ("A + Visual only") recorded; C-009 pause marked SUPERSEDED (2026-10-11).
- [x] Health-below-zero vs. M1 acceptance item 4 resolved by P-012 Health clamping (2026-10-11).
- [x] Ultimate-first same-timestamp resolution P-013 recorded (2026-10-11).
- [x] Basic Attack dice rolled and stored at commitment P-014 recorded (2026-10-11).
- [x] M1 tech stack approved: TypeScript + Vitest headless engine package (T-008, 2026-10-11). Full-game architecture T-001 to T-007 remains PROPOSED.
- [x] M1 readiness decisions recorded: fixture Basic Attack P-015, content-check rules T-009, targeting/defeated attackers P-016 (2026-10-11).
- [x] Owner-confirmed critical-hit interpretation P-017 recorded: the dice roll includes the flat modifier K (2026-10-11, M1 step 4).
- [x] M1 headless deterministic duel implemented and tested (2026-10-11): all seven M1 acceptance criteria met; item 5 is verified by review rather than an automated check. Implemented on branch `claude/modest-hamilton-ngoiru` (commits `b51b15c` to `6ab2585`); not yet merged into `main`.
- [ ] Schema fixes from the audit applied.
- [ ] M1 reviewed and merged into `main`.

## Session log

### 2026-10-11 — Documentation audit and repair (M0)
- **Scope:** audit only, then documentation repair only. No application code, no schema content changes, no dependencies.
- **Checks run (Python `jsonschema` 4.26.0, already installed):** all 9 JSON files parse; all 3 schemas are valid Draft 2020-12; all 3 templates and both examples validate against their schemas; 3/3 `$ref` targets resolve; 11 cross-file IDs are missing (placeholder references); 13 negative probes were all accepted by the schemas (listed in `OPEN_QUESTIONS.md`).
- **Changes:**
  - Moved every file from the repository root into the layout in `README.md` (contents unchanged for all JSON files).
  - Root `README.md` is now the master README; the combat-package README moved to `docs/COMBAT/README.md`.
  - Merged `resolution-contract.md` into `docs/COMBAT/RESOLUTION_CONTRACT.md` without promoting any rule.
  - Added the status vocabulary and older-label mapping, provisional rules P-001 to P-010, and notes on affected earlier entries to `DECISIONS.md`.
  - Added `docs/COMBAT/PROTOTYPE_RULESET_V0.md` and `docs/GLOSSARY.md`.
  - Marked `docs/proposals/0001-initial-plan.md` SUPERSEDED.
  - Updated `OPEN_QUESTIONS.md`, `IMPLEMENTATION/ROADMAP.md` (M0 status, M1 scope), `CLAUDE.md` project map and `PACKAGE_MANIFEST.json`.
- **Next smallest task:** owner confirms I-1 to I-9 and approves the M1 tech stack and dependencies; then implement M1.

### 2026-10-11 — Prototype combat clarifications (documentation only)
- **Scope:** record the accepted interpretations I-1 to I-9 and the Ultimate timing model P-011. No code, schemas, templates, examples or dependencies changed.
- **Changes:** `COMBAT/PROTOTYPE_RULESET_V0.md` (I-1 to I-9 written in as rules, new sections 2.1, 5.1, 9.1, 9.2, 11 and 12; overtime table corrected to ×64 at 55 s); `DECISIONS.md` (P-011, accepted interpretations table, C-009/C-010 notes); `COMBAT/RESOLUTION_CONTRACT.md` (concurrent Ultimate model, old pause text kept and marked SUPERSEDED); `OPEN_QUESTIONS.md`; `GLOSSARY.md`; `IMPLEMENTATION/ROADMAP.md`.
- **Next smallest task:** owner resolves the Health-below-zero wording and approves the M1 tech stack and dependencies; then implement M1.

### 2026-10-11 — Final combat documentation corrections (documentation only)
- **Scope:** record P-012 (Health clamped at 0) and P-013 (Ultimate-first same-timestamp resolution). No code, schemas, templates, examples or dependencies changed.
- **Changes:** `COMBAT/PROTOTYPE_RULESET_V0.md` (sections 3, 7, 9.2, 10, 11 and new 11.1); `COMBAT/RESOLUTION_CONTRACT.md` (sections 4, 6, 10); `DECISIONS.md` (P-012, P-013, notes on C-009 and P-006); `OPEN_QUESTIONS.md` (two questions resolved, two new gaps recorded); `IMPLEMENTATION/ROADMAP.md` (M0 status, M1 scope, acceptance item 4, required tests, M4); `GLOSSARY.md`.
- **Next smallest task:** owner approves the M1 tech stack and dependencies; then implement M1.

### 2026-10-11 — Basic Attack dice at commitment (documentation only)
- **Scope:** record P-014 (Option A). No code, schemas, templates, examples or dependencies changed.
- **Changes:** `COMBAT/PROTOTYPE_RULESET_V0.md` (section 9.2 rewritten as the full random-number order; new section 9.3 on the stored attack outcome; sections 7, 10, 11.1 and 12 aligned); `COMBAT/RESOLUTION_CONTRACT.md` (section 4: P-013 steps, P-014 summary, old algorithm's roll step marked superseded); `DECISIONS.md` (P-014 and notes on earlier entries); `OPEN_QUESTIONS.md` (random-number timing resolved; opening-Ultimate draw placement added); `IMPLEMENTATION/ROADMAP.md` (M1 scope and tests; M4 Ultimate tests); `GLOSSARY.md` (Commitment).
- **Next smallest task:** owner approves the M1 tech stack and dependencies; then implement M1.

### 2026-10-11 — M1 readiness decisions (documentation only)
- **Scope:** record the four decisions approved after the M1 implementation-readiness audit. No code, schemas, templates, examples or dependencies changed.
- **Changes:** `DECISIONS.md` (T-008, T-009, P-015, P-016; P-007 note); `COMBAT/PROTOTYPE_RULESET_V0.md` (sections 3, 7, 8, 9.2, 11.1, 12 and header); `COMBAT/RESOLUTION_CONTRACT.md` (section 4); `IMPLEMENTATION/ROADMAP.md` (M0 status, M1 scope, acceptance item 7, required tests); `OPEN_QUESTIONS.md` (headless-first question resolved for M1; content-check note).
- **Next smallest task:** implement M1, starting with the package scaffold and `npm run check`, when the owner asks.

### 2026-10-11 — M1 headless deterministic duel (implementation)
- **Milestone and scope:** M1 as defined in `IMPLEMENTATION/ROADMAP.md`: a headless TypeScript combat engine (T-008) that runs a complete, reproducible Basic-Attack battle between two sides of 1–5 test units, using only the PROVISIONAL rules in `COMBAT/PROTOTYPE_RULESET_V0.md` (P-001 to P-017, I-1 to I-9), plus the T-009 content check. Delivered in nine reviewed steps on branch `claude/modest-hamilton-ngoiru`.
- **Implemented and tested (M1):**
  - npm workspace with `packages/engine` (TypeScript 7.0.2, Vitest 5.0.3, exact versions; no runtime dependencies); `npm run check` = both type-checks + Vitest.
  - Seeded sfc32 generator following PractRand pre0.95 seeding, rejection-sampled dice, side assignment from the first output (P-009, I-5).
  - Dice-expression parser and pure rule functions: attack interval (I-2), overtime multiplier and boundaries (I-3, I-4), hit roll (P-004, C-012), exact-fraction damage (P-005, I-9, P-017), initiative totals, skips and opening-Ultimate winners (P-008, C-001, C-002), P-010 ordering, targeting (P-003, P-016, I-8).
  - Battle-input validation that reports every error, before any random draw.
  - Battle setup: sides, initiative roll order, totals, skip flags, opening-Ultimate winners (recorded only), action order, first timers, setup events.
  - Moment loop (`runBattle`): overtime boundary first; commitment of every due Basic Attack with dice rolled and the complete damage stored (P-013, P-014); an intentionally empty Ultimate stage; resolution in P-010 order with Health clamped at 0 and excess damage logged (P-012); defeat events right after lethal damage; battle result only after the whole moment; exact 60,000 ms hard stop.
  - Typed event log, canonical JSON serialisation (`serializeEvents`), test-only SHA-256 replay hashing, three golden replays.
  - `tools/content_check.py` (T-009) and its tests.
- **Not implemented (deferred beyond M1):** Ultimates, the opening bonus Ultimate's effect (M1 only records the winners), Class Resources, Rogue/Sorcerer critical rules, status effects and catalogue effects, saving throws, death saves, Magic Resistance and non-physical damage types, Traits, Items, levels, Feats, the economy and shop, players and matches, the browser UI, the server and multiplayer, and real roster content. The full game is not implemented.
- **Files added or changed:**
  - root: `package.json`, `package-lock.json`, `.gitignore`, `tsconfig.base.json`;
  - `packages/engine/` package and config files, `src/` (`config`, `types`, `validate`, `index`, `rng/`, `dice/`, `rules/`, `battle/`, `log/`) and `test/` (20 Vitest files, `fixtures/`, `support/`, `golden/`);
  - `tools/content_check.py`, `tools/test_content_check.py`;
  - documentation: `DECISIONS.md` and `COMBAT/PROTOTYPE_RULESET_V0.md` (P-017, step 4), this file and `IMPLEMENTATION/ROADMAP.md` (step 9).
- **Commands and exact results (2026-10-11, at `6ab2585`):**
  - `npm run check`: both type-checks passed; Vitest **20 files, 449 tests passed, 0 failed**; exit code 0.
  - `npm run content-check`: 9 JSON files parsed; **0 schema-validation failures**; **11 known content-data warnings** (the nine documented missing IDs `apply_stagger_on_hit`, `rogue_resource_on_critical`, `example_basic_attack`, `example_passive`, `example_ultimate`, `example_feat_a` to `example_feat_d`, and the two documented `attack_commit` mismatches in `templates/ability-template.json` and `examples/storm_vanguard.json`); **0 unexpected warnings**; `RESULT: PASS`; exit code 0. The warnings are non-fatal by T-009 and are not suppressed.
  - `npm run content-check:test`: **13 Python tests OK**; exit code 0.
- **Test inventory (449 Vitest tests):** validate 134; dice.parse 37; battle 24; purity 24; rng.dice 23; rng.sfc32 23; rules.overtime 22; rules.interval 21; setup 21; schedule-targeting 20; rules.initiative 19; rules.damage 18; serialize 16; golden 10; rules.hit 10; rng.sides 9; rules.ordering 7; sha256 6; replay 3 (the 100-run repeat, the different-seeds check and the 1,000-battle stress test); smoke 2. Plus 13 Python content-check tests.
- **Golden replays (`packages/engine/test/golden/`):** `duel-12345` (101 events; side B wins at 29,000 ms), `three-v-three-2024` (258 events; side B wins at 31,000 ms), `five-v-five-max-seed` (361 events; side B wins at 28,179 ms). Before their SHA-256 hashes were recorded, each log was matched event for event by an independent Python implementation of the ruleset (random numbers checked against a C transcription of PractRand), and each hash was confirmed with `sha256sum` and Python `hashlib`.
- **M1 acceptance criteria:**

  | # | Criterion | Status | Evidence |
  |---|---|---|---|
  | 1 | `npm run check` passes | Met | 20 files, 449 tests, exit 0 |
  | 2 | Same seed and input give an identical log and hash across 100 runs | Met | `replay.test.ts` (100 runs) and `golden.test.ts` (3 recorded hashes) |
  | 3 | Different seeds give different logs | Met | `replay.test.ts`: ten seeds give more than one distinct hash |
  | 4 | 1,000 seeded random battles end as win, loss or draw by the hard cap; Health never below 0 in state or log; excess only as `excessDamage` | Met | `replay.test.ts` 1,000-battle stress test, plus invariants over 60 battles in `battle.test.ts` |
  | 5 | All tunable numbers live in one config module | Met, by review | `src/config.ts` holds every rule and limit value. `smoke.test.ts` checks that the config is frozen and that its main ruleset values (hard stop, overtime start and step, AC base, critical multiplier, Armor constant, minimum damage, denominators, board slots, units per side) match the ruleset. A review on 2026-10-11 found no tunable constant outside it; the remaining literals are formula arithmetic and sfc32 algorithm constants. The planned automated constant scan was not added. |
  | 6 | The engine imports nothing from the DOM, Node I/O or clocks | Met | Engine `tsconfig` (`lib: ES2022`, `types: []`) rejects DOM and Node globals; `purity.test.ts` scans every source file (and self-tests its patterns) |
  | 7 | The content check (T-009) passes | Met | `npm run content-check` PASS, exit 0, 11 known warnings; `npm run content-check:test` 13 tests OK |

- **Commit history (all on `claude/modest-hamilton-ngoiru`, after `main` at `c0138cd`):** `b51b15c` step 1 scaffold; `2986407` step 2 random numbers; `04fe536` step 3 parser and rule functions; `6038c3c` step 4 P-017 and validation; `0af5b47` step 5 battle setup; `70ea214` step 6 moment loop; `dce381a` step 7 serialisation, hashing and golden replays; `6ab2585` step 8 content check; then this step 9 report.
- **New decisions during M1:** P-017 (owner-confirmed, PROVISIONAL): the dice roll includes the flat modifier K, so a critical hit doubles it. No other rule was added or changed.
- **Technical choices made during M1 (not game rules):** sfc32 seeding as in PractRand with a uint32 seed; rejection-sampled dice; BigInt exact-fraction damage; technical input limits in `config.ts` (stat magnitude 1,000,000,000; attack speed 1,000,000 thousandths; ratio 50,000 basis points; dice N ≤ 100, M ≤ 1,000, |K| ≤ 1,000,000); event names and fields with `logVersion` 1; a test-only pure-TypeScript SHA-256 (no `@types/node`); the content check runs separately from `npm run check`.
- **Caveats and limitations:**
  - Acceptance item 5 is verified by review only, as noted above.
  - The golden hashes change on purpose whenever the random-number order, a rule, a config value or the event format changes; they must then be re-verified before being re-recorded.
  - `npm run content-check` needs Python 3 and `jsonschema` 4 or later (exit code 2 if missing).
  - The engine does not emit a separate "attack scheduled" event (contract section 10 allows refining that list); timers can be read from `initiativeResolved` and the attack events.
  - The schema and content-data issues listed in `OPEN_QUESTIONS.md` remain open; the content check reports them as warnings only.
  - The root `README.md` still states that no application code exists, and the `CLAUDE.md` project map does not yet list `packages/` or `tools/`. Both were left unchanged in this step.
- **Next smallest task:** owner review of M1. If approved, a pull request from `claude/modest-hamilton-ngoiru` into `main` when the owner asks. M2 (minimal economy and bot match) needs its open questions in `OPEN_QUESTIONS.md` settled before implementation.

## Required end-of-task report
- Milestone and scope
- Files changed
- Commands/checks run and exact results
- Acceptance criteria passed/failed
- New decisions or unresolved blockers
- Next smallest recommended task
