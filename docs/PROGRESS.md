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
- [x] M1 headless deterministic duel implemented and tested (2026-10-11): all seven M1 acceptance criteria met; item 5 is verified by review rather than an automated check. Implemented on branch `claude/modest-hamilton-ngoiru` (commits `b51b15c` to `6ab2585`); merged into `main` on 2026-10-11 (see below).
- [ ] Schema fixes from the audit applied.
- [x] M1 reviewed and merged into `main` (PR #5, merge commit `1fafb5a`, 2026-10-11).
- [x] M2 redefined as a browser-playable Expedition and its prototype decisions recorded (T-010, P-018 to P-021, 2026-10-11).
- [x] M2 first playable Expedition implemented and tested (2026-10-11) on branch `claude/modest-hamilton-ngoiru`; its two pending P-018 details were confirmed in the M3 review (R-003, R-004).
- [x] M2 reviewed and merged into `main` (PR #6, merge commit `b00e885`, 2026-10-11).
- [x] Approved 135-Champion roster recorded (D-017 to D-021, superseding D-003 and D-013) and integrated as M3 (P-022), 2026-10-11, on branch `claude/modest-hamilton-ngoiru`.
- [x] M3 reviewed and merged into `main` (PR #7, merge commit `062da77`, 2026-10-11).
- [x] M4 economy audit completed and prototype economy decisions P-023 to P-029 recorded (2026-10-11).
- [x] M4 decisions P-030 and P-031 recorded and the M4 implementation plan (checkpoints A–F) approved by the owner (2026-10-11).
- [x] M4 economy and recruitment implemented and tested (checkpoints A–F, 2026-10-11): A `8a78e42`, B `3f81232`, C `8774c13`, D `823d368`, E `abe8b8e` approved; F `3c1aaf2`.
- [x] M4 reviewed and merged into `main` (PR #8, merge commit `d7794fc`).
- [x] Canonical rulebooks created in `docs/rules/` (index and rulebooks 01–12), owner decisions D-022 to D-028 and P-032 recorded, and a full-game roadmap (G0–G11, PROPOSED) added (2026-10-12). Documentation only.
- [ ] Owner decision pack G0 (`docs/rules/12-unresolved-decisions.md` §6).

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

### 2026-10-11 — M2 first playable Expedition (implementation)
- **Milestone and scope:** M2 as redefined by the owner (T-010; `IMPLEMENTATION/ROADMAP.md`): a small browser-playable loop on top of the unchanged M1 engine. Before coding, the repository was found to differ from the M2 brief: there was no browser application, and the roadmap's M2 was a headless economy milestone. The owner chose to reorder the milestones and approved four prototype decisions (T-010, P-018, P-019, P-020; P-021 records the fixture content they describe).
- **How to run it** (from the repository root, after `npm install`):
  - `npm run dev`: start the Vite development server, then open the printed URL.
  - `npm run build`, then `npm run preview`: production build in `apps/web/dist/` and a local preview server.
  - Add `?seed=<0-4294967295>` to the URL to replay an Expedition exactly; without it a random seed is chosen and shown in the header.
  - `NODE_PATH="$(npm root -g)" node apps/web/scripts/smoke.mjs [screenshot-dir]`: browser smoke test (needs `npm run build` first, plus a Playwright installation outside the repository; exit 2 if Playwright is missing).
- **What the player can do:** see the next Monster Round's monsters; select Champions from a bench of four and place 1–3 of them in the 12 board slots (front, middle, back); start a battle (blocked, with reasons shown, until the team is legal); watch the battle play back with Health bars and a combat log, or skip to the result; see Victory, Defeat or Draw; after a victory choose one of three reward bundles (Gold and/or a new fixture Champion); then continue to the next Monster Round or end the Expedition; after a defeat, a draw, ending voluntarily or clearing all three Monster Rounds, see a summary and start a new Expedition.
- **Implemented:**
  - `apps/web` workspace (`@dc/web`), plain TypeScript + DOM, built with Vite 8.3.4. Vite is now an explicit exact-pinned root devDependency; it was already installed as Vitest's peer, and the lockfile gains no new third-party package (only the workspace link and removed `peer` flags).
  - `src/game/` (pure; same restricted tsconfig as the engine plus a purity scan): `config.ts` (P-018 to P-020 values), `fixtures.ts` (seven fixture Champions, three fixture Monster Rounds, reward bundles; P-021), `formation.ts` (slots and rows from the engine's `M1_CONFIG` and `rowOfSlot`; team legality), `expedition.ts` (explicit state machine `transition(state, action, content)`, content checks, P-009 battle-seed derivation, engine invocation), `battleView.ts` (read-only view of the engine log for playback and the combat log).
  - `src/ui/`: a renderer that only sends actions to `transition` and draws the result; playback timers are presentation only.
  - Root scripts: `check` now runs the engine and web checks; new `dev`, `build`, `preview`. `.gitignore` adds `dist/`.
- **Not implemented:** shop, Gold spending, Renown, player Health, PvP, bots, Items and Components, Traits, Ultimates and every other M1 exclusion, persistence (a page reload starts a new Expedition), real Champion or Monster content, balanced rewards.
- **Commands and exact results (2026-10-11):**
  - `npm run check`: all type-checks passed (engine 2 configs, web 3 configs); engine Vitest **20 files, 449 tests passed** (unchanged); web Vitest **5 files, 52 tests passed**; exit code 0.
  - `npm run content-check`: PASS, 0 failures, 11 known warnings, 0 unexpected; exit 0.
  - `npm run content-check:test`: 13 tests OK; exit 0.
  - `npm run build`: passed (about 37 kB of JavaScript, 4 kB of CSS).
  - Browser smoke test in Chromium (Playwright 1.56.1, global install): **30 of 30 checks passed**, no console errors or warnings; screenshots were reviewed for the preparation, battle, reward, decision, end and 375 px mobile screens.
  - Mutation check: seven deliberate bugs in `expedition.ts` (missing phase guards, a reward on a draw, Gold surviving a restart, the outcome read from the side instead of the participant, a single seed for all encounters, a stale battle after continuing) were each caught by the web tests, and the file was restored.
- **Test inventory (web, 52 Vitest tests):** expedition 17 (creation, placement, removal, limits, invalid starts, content problems, engine validation errors, phase guards, seed derivation, seed parsing); purity 9; run-flow 15 (engine result stored unchanged, outcome mapping, displayed Health read from the log, playback independence, determinism, reward once, continue, retreat, clear with seed 2, defeat with seed 1, hard-stop draw, clean restart); formation 7; content 4 (content valid, fixture stats equal to the engine test fixtures, every encounter is a valid engine battle).
- **M2 acceptance (owner's brief):**

  | AC | Status | Evidence |
  |---|---|---|
  | 01 Existing application preserved | Pass | The only prior application was the engine and tools: its 449 tests and the content check pass unchanged, and no engine file changed. `npm run build` and `npm run dev`/`preview` run the new client. |
  | 02 Team preparation | Pass | `formation.test.ts`, `expedition.test.ts`; smoke: Start disabled with no team, a fourth Champion refused with a message |
  | 03 Real engine | Pass | `run-flow.test.ts`: the stored events equal `runBattle(input)` byte for byte (canonical JSON) |
  | 04 Understandable battle | Pass | Smoke and screenshots: Health bars, combat log, Victory/Defeat banners |
  | 05 Reward once | Pass | Tests reject a second claim; smoke checks Gold 1 → 4 → 5 and a bench of 5 |
  | 06 Next choice | Pass | Tests and smoke for continue and for ending the Expedition |
  | 07 Finish and restart | Pass | Clear, defeat, draw and retreat endings; restart equals a fresh Expedition (test) and shows no stale log, Gold or formation (smoke) |
  | 08 Invalid states | Pass | Content problems, engine validation errors, missing Champion data and wrong-phase actions return messages with the state unchanged |
  | 09 Determinism | Pass | Same seed and choices give identical logs; playback position never changes the stored result |
  | 10 Automated tests | Pass | 449 + 52 Vitest tests and 13 Python tests pass |
  | 11 Build and browser smoke | Pass | `npm run build`; 30/30 smoke checks in Chromium |
  | 12 Documentation | Pass | This entry, `ROADMAP.md`, `DECISIONS.md`, `GLOSSARY.md`, `README.md`, `CLAUDE.md` |

- **Rules decisions:** T-010, P-018, P-019, P-020 (owner-approved, PROVISIONAL, M2 only) and P-021 (the fixture basis of those choices), all in `DECISIONS.md`. *Confirmation pending* for two P-018 details: the voluntary "End Expedition here" choice, and Champions starting each battle at full Health.
- **Caveats and limitations:**
  - All Champions and monsters are labelled fixtures with Role-table stats and the same Basic Attack; there are no abilities, Traits or Items, and the UI says so.
  - Reward values and encounter strength are placeholders chosen by a 300-seed simulation, not balance.
  - Gold has no use yet. A page reload discards the Expedition, by design (no persistence).
  - The browser smoke test needs Playwright installed outside the repository and is not part of `npm run check`; the UI layer itself has no unit tests (DOM tests would need a new dependency such as jsdom), so it is covered by the smoke test.
  - The M1 caveats still apply: the config centralisation (M1 acceptance item 5) is reviewed rather than scanned, replay hashes need re-verification when rules change, the content check needs Python 3 and `jsonschema`, and there is no "attack scheduled" event.
- **Next smallest task:** owner review of M2, including the two *confirmation pending* details in P-018. M3 (economy and bot match) needs the B5 economy values first.

### 2026-10-11 — M3 approved roster integration (implementation)
- **Milestone and scope:** replace the prototype's placeholder Champions with the owner-approved 135-Champion roster, with strict validation, keeping the M1 engine and the M2 Expedition behaviour. Excluded: Trait effects, economy, shop, purchases, rerolls, upgrades, Multi-Class, ability execution, and any change to the bench of four or the 1–3 fielding limit. Roadmap: this became M3, and later milestones moved up by one.
- **Source audit:** the first upload, `Dungeons_and_Champions_Roster_135_Option_A.xlsx`, was rejected because it used only 15 Class/Race/Origin combinations, each repeated 9 times. The owner then supplied `Dungeons_and_Champions_Roster_135_Option_A_Unique_Combinations.xlsx` (SHA-256 `a3b302cd…9bfe`). Checks on it: 135 rows (DC-001 to DC-135), 135 distinct names, **135 unique combinations**, and **every one of the 45 traits has exactly 9 Champions**. Trait names match the approved lists exactly, and there are no formulas or stray whitespace. Only the Race and Origin columns differ from the rejected draft. The 24 "Feat Milestone 2" texts describing a Multi-Class Feat were excluded (D-020).
- **Roster source and format:**
  - `content/roster/source/…Unique_Combinations.xlsx`: the approved workbook (source record).
  - `content/roster/champions.json`: the single roster file the game reads (`format: dc-roster-v1`). Per Champion: `id` (DC-001…), `name`, `class`, `race`, `origin` (approved), `proposed` (cost rank, rarity, Role, ability and Feat text, design status, notes: PROPOSED), and `excluded` where Multi-Class text was dropped.
  - `docs/COMBAT/schemas/roster.schema.json`: the file's JSON Schema, and the one place the 45 canonical trait names are listed.
- **How to validate the roster:** `npm run roster:check` (the JSON matches the workbook; needs Python `openpyxl`), `npm run content-check` (schema; needs Python `jsonschema`), and `npm run check` (strict roster rules in `apps/web/src/game/roster.ts`, plus every test). The app itself refuses to start, with the reasons shown, if the roster fails validation.
- **How to add or edit a Champion safely:** edit the workbook, never `champions.json` by hand. Replace the file in `content/roster/source/` (keep the name, or update `WORKBOOK` in `tools/import_roster.py`), run `npm run roster:import`, then run the three checks above. The roster must stay at exactly 135 Champions with unique combinations and 9 per trait, so a single new or moved Champion fails validation by design; changing those rules needs an owner decision (D-017). Commit the workbook and the regenerated JSON together.
- **Approved vs provisional:** approved (D-017 to D-021): roster size, the 45 trait names, the brackets as design targets, team size 12, no Multi-Class, and the IDs, names and Class/Race/Origin assignments. PROPOSED: costs, rarities, Roles, abilities and Feats. Prototype-only (P-022): the seeded draw, the temporary stats and the Basic Attack fallback.
- **Temporary combat fallbacks (P-022):** Champions whose PROPOSED Role has a Role-table row use those stats. Fighter and Ranger Roles (22 Champions) use a labelled placeholder equal to the rounded mean of the Role table. Every Champion uses the P-015 Basic Attack (1d8 + Attack, physical). Proposed ability text is shown as "not implemented". Monsters remain fixtures.
- **Expedition changes:** the bench of four and the six Champions offered in rewards are drawn by seed from the roster when the Expedition starts, on a separate generator stream, so battle seeds are unchanged. Champion cards show ID, Class · Race · Origin, PROPOSED Role and cost, the stat source, and the proposed abilities. Fielding, battles through `runBattle`, rewards, decisions, endings and restart are unchanged.
- **Files:** `content/roster/`; `docs/COMBAT/schemas/roster.schema.json`; `tools/import_roster.py`; `tools/content_check.py` and `tools/test_content_check.py` (roster schema check, 7 new tests); `apps/web/src/game/` (`roster.ts`, `champions.ts`, `content.ts` new; `expedition.ts`, `fixtures.ts`, `config.ts`, `battleView.ts`, `index.ts` changed); `apps/web/src/ui/` (`app.ts`, `main.ts`, `styles.css`); `apps/web/tsconfig*.json` (JSON imports); `apps/web/test/` (`roster.test.ts`, `champions.test.ts` new; M2 tests updated); `apps/web/scripts/smoke.mjs`; `package.json` (`roster:import`, `roster:check`); documentation (DECISIONS, TRAITS, CHAMPIONS, PROJECT_BRIEF, ECONOMY, GLOSSARY, OPEN_QUESTIONS, ROADMAP, README, CLAUDE.md, this file); `champion-combat.schema.json` (`class` enum now lists the 15 Classes). No engine file changed.
- **Legitimate test changes:** M2 tests that assumed the fixed Tank/Bruiser/Marksman/Support bench and fixture reward IDs now use roster-drawn benches and the new bundle IDs (`e1-champion-a`, …). Seeds were re-chosen: 24 (clear), 1 (Round 3 defeat), 26 (Round 2 draw). The behaviours they check are unchanged, and no assertion was weakened.
- **Commands and exact results (2026-10-11):**
  - `npm run check`: type-checks passed; engine **20 files, 449 tests passed** (unchanged); web **7 files, 79 tests passed** (roster 15, champions 7, expedition 17, run-flow 17, purity 12, formation 7, content 4); exit 0.
  - `npm run content-check`: PASS, 0 failures, 11 known warnings, 0 unexpected; the roster is validated against its schema.
  - `npm run content-check:test`: **20 tests OK** (13 before M3).
  - `npm run roster:check`: PASS (135 Champions, 24 Multi-Class texts excluded).
  - `npm run build`: passed (about 137 kB of JavaScript, 22 kB gzipped; the roster file is bundled).
  - Browser smoke test (Chromium, global Playwright 1.56.1): **39 of 39 checks passed**, with no console errors or warnings. It covers: the app loads; 4 roster Champions with IDs, traits and PROPOSED Roles; placeholder stats labelled; proposed abilities marked "not implemented"; team limits; a played-back victory; reward applied once; continue; a full clear; a clean restart; double-click protection; seed replay (same bench and an identical battle log after reload); a defeat; a draw; ending voluntarily; and 375 px width with no horizontal scroll. Screenshots were reviewed.
  - Mutation checks: 7 removed validator rules and 5 integration bugs were each caught by the tests.
- **Gameplay effect to review:** with roster Champions the Expedition is much harder than in M2. In 300 seeded runs, a "front-line first" team cleared 38 times, and the first three bench Champions cleared 15 times (M2: about two in three). Round 1 is won almost always, Round 2 about two times in three. The cause is that 68 of the 135 Champions are Mages, Controllers or Supports, whose power (Spell Power, abilities) is not implemented, so their temporary Attack is low. Monsters and rewards were not retuned (that would change P-018/P-019 values); see `OPEN_QUESTIONS.md`.
- **Caveats:** the importer needs `openpyxl` and the content check needs `jsonschema` (Python; outside `npm run check`). The smoke test needs Playwright outside the repository. Champion names include their number suffix ("Aerin Ashford 001") exactly as in the workbook. The M1 and M2 caveats still apply.
- **Owner review (2026-10-11), recorded as R-001 to R-005 in `DECISIONS.md`:**
  - no retuning; the reduced clear rate is a known limitation, to be reassessed after combat abilities exist (R-001);
  - Fighter and Ranger are not added as Roles; the labelled placeholder stays, and Role assignments stay PROPOSED (R-002);
  - the voluntary end of an Expedition is confirmed, with no extra reward (R-003);
  - full Health at the start of each Monster Round is confirmed for the prototype (R-004);
  - team capacity stays 12, the bench of four and 1–3 fielding are unchanged, and Renown is not implemented (R-005).
  No code or rule values changed as a result.
- **Next smallest task:** review and merge of the M3 pull request. M4 is not started.

### 2026-10-11 — M4 economy decisions recorded (documentation only)
- **Scope:** recorded the owner's M4 prototype economy decisions after the M4 audit. Source code, tests, configuration, roster data and schemas were not changed. Nothing was committed.
- **Decisions:** P-023 (Tavern: 6 slots, auto-refresh, 2-Gold reroll of all six), P-024 (price = provisional cost rank 1–5, not final balance), P-025 (starting Gold 3), P-026 (reward choices unchanged; no base income, interest or streaks; Gold carries between rounds), P-027 (12 owned Champions from all sources; starting four and fielding 1–3 unchanged), P-028 (no owned or reserved reward Champions in the shop; no combining), P-029 (separate seeded shop stream).
- **Documents changed:** `DECISIONS.md`, `GAMEPLAY/ECONOMY.md`, `GAMEPLAY/DUNGEON_AND_REWARDS.md`, `GLOSSARY.md`, `OPEN_QUESTIONS.md`, `IMPLEMENTATION/ROADMAP.md` (M4 checkpoints A–F, proposed), this file.
- **Follow-up review (same day):**
  - P-030: Champion bundles disabled at the 12 cap, 3-Gold bundle always available;
  - P-031: all six reward Champions reserved for the whole Expedition;
  - the shop-stream derivation approved in principle, with acceptance tests showing unchanged seeds, bench, reward draws and battle logs, and rejected actions never using a shop number;
  - checkpoints A–F approved;
  - two-player matches, the bot, player Health and match-end rules moved to M8 with their requirements kept.
- **Next:** M4 checkpoint A when the owner has reviewed this documentation. No code has changed yet.

### 2026-10-11 — M4 checkpoint A: economy configuration and state model
- **Scope:** settings and state only. There is no Gold accounting, shop generation, purchase, reroll or UI change. The engine, battle seeds, bench and reward draws, reward values and roster data are unchanged. Starting Gold stays 0 until checkpoint B, which adds the P-025 value of 3.
- **Changes:**
  - `config.ts`: `shopSlots` 6, `rerollCost` 2, `maxOwnedChampions` 12.
  - New `shop.ts`: shop slot and shop types, the empty shop, settings validation.
  - `expedition.ts`: state fields `shop` (number and slots) and `nextShopNumber`, initialised empty and 0 and reset on a new Expedition; `reservedRewardChampions` (all six, for the whole Expedition); `economyStateProblems` (consistency checks for Gold, the cap, duplicates, shop numbering, slot count, prices, and reserved or owned offers); the content check also validates the settings and that a six-slot shop can always be filled (117 eligible with a full collection).
  - Tests: new `economy-state.test.ts` and `seed-baseline.test.ts`, and one expected-message addition in `expedition.test.ts`.
- **Results:** see the checkpoint A report. Every check passes, and 9 deliberate bugs were each caught by the tests.

### 2026-10-11 — M4 checkpoint B: starting Gold and single-path Gold accounting
- **Scope:** Gold only. No shop generation, purchases, rerolls or shop UI. The engine, roster data, monsters, reward bundles and values, the 12 cap, fielding 1–3, and the battle, bench and reward draws are unchanged.
- **Changes:**
  - `config.ts`: `startingGold` 3 (P-025).
  - New `gold.ts`: `applyGoldChange`, the one function that changes Gold. Income kind `reward`; spending kinds `purchase` and `reroll` are prepared but unused. Spending more than is held, or a negative or fractional amount, is refused without changing anything. Also `startingGoldAccount` and `goldAccountProblems` (Gold = 3 + earned − spent, nothing negative).
  - `expedition.ts`: state fields `goldEarned` and `goldSpent`; a new Expedition starts with 3 / 0 / 0; reward claims add their bundle Gold through `applyGoldChange`; `economyStateProblems` includes the reconciliation.
  - Tests: new `gold.test.ts`. Existing Gold expectations in `expedition.test.ts`, `run-flow.test.ts` and the smoke test raised by exactly 3, as P-025 requires, and one expected reconciliation message added in `economy-state.test.ts`. No assertion was removed or loosened.
- **Results:** see the checkpoint B report.

### 2026-10-11 — M4 checkpoint C: deterministic shop generation and provisional prices
- **Scope:** shop generation only. No buying, rerolling, Gold spending, shop UI or reward changes. The engine, roster data, monsters, reward values, starting Gold 3 and Gold accounting, the 12 cap and fielding 1–3 are unchanged.
- **Changes:**
  - `shop.ts`: the P-029 stream (`SHOP_ROOT_OUTPUT` 5; `shopRootSeed` = output 5 of `Sfc32(seed)`; `shopSeed(k)` = output k+1 of `Sfc32(root)`); `generateShop` (six different Champions by a partial Fisher–Yates shuffle with the engine's `rollDie` and `BattleRng(shopSeed(k))`); slots carry `priceStatus: 'provisional'` and price = proposed cost rank.
  - `expedition.ts`: `shopCandidates` (roster order, minus owned, minus all six reserved); shop 0 generated with the Expedition; a fresh shop on every accepted continue; the shop number advances only on generation; `economyStateProblems` checks the provisional marker; the content check refuses a round count whose roster draw would reach output 5.
  - Tests: new `shop.test.ts`. `economy-state.test.ts` updated where checkpoint A asserted "no shop yet" (now shop 0 and next number 1); its invariant cases start from a shop-less copy, so each still checks exactly one problem; a provisional-marker case was added.
- **Results:** see the checkpoint C report.

### 2026-10-11 — M4 checkpoint D: purchases, rerolls and capacity
- **Scope:** game logic only; no browser shop panel (checkpoint E). The engine, reward values, monsters, roster data, starting four and fielding 1–3 are unchanged.
- **Changes (`expedition.ts`):**
  - Action `buy` (slot 0–5), preparation only. Checks run in order: phase, slot exists, not sold, fewer than 12 owned, Champion data exists, enough Gold. The provisional price is spent through `applyGoldChange` ('purchase'); the Champion is added once as a new instance, not placed on the board; the slot is marked sold; the shop number is unchanged.
  - Action `reroll`, preparation only. It spends 2 Gold through `applyGoldChange` ('reroll'), then generates the next numbered shop (all six slots replaced; the shop number advances once).
  - Reward claims: at 12 owned, Champion bundles are refused, and the 3-Gold bundle stays available (P-030).
  - Every rejection returns the identical state: Gold, accounting, collection, offers, sold flags and shop numbering are unchanged.
- **Tests:** new `purchase.test.ts`. No existing test was changed.
- **Results:** see the checkpoint D report.

### 2026-10-11 — M4 checkpoint E: browser Tavern
- **Scope:** UI only, plus a pure helper for button states. No new rules: selling, duplicates, combining, interest, streaks, XP and levels stay out; reward values, monsters, the engine and roster data are unchanged.
- **Changes:**
  - New `apps/web/src/game/shopView.ts`: `priceLabel` ("Price: N Gold · provisional"), `buyAvailability`, `rerollAvailability` and `rewardAvailability`. They give "Sold", "Need N Gold (you have M)", "Collection full (12)", "Reroll: need 2 Gold (you have M)" and "Available during preparation".
  - `ui/app.ts`: a Tavern panel on the preparation screen only (six cards with name, price, card details and a Buy button; a "Reroll all six (2 Gold)" button; a summary of Gold and owned count). Unavailable buttons are disabled and say why in words, with accessible labels. Reward cards are disabled at the cap with "Collection full (12)" (the 3-Gold card stays). The reward screen says Gold carries over and can be spent in the Tavern.
  - `ui/styles.css`: price and sold styles; a sold card's name also reads "(sold)".
  - Tests: new `shop-view.test.ts`, including over 1,000 button states checked against `transition`. The smoke test gains a Tavern flow and a mobile check. The existing M3 trait-line check is scoped to the bench, because Tavern cards reuse the same card details; it still requires exactly four bench cards.
- **Not covered in the browser:** the "Collection full (12)" states, which need 12 owned. That isn't reachable in a short scripted run; unit tests cover the labels and the button-to-rule agreement.
- **Results:** see the checkpoint E report.

### 2026-10-11 — M4 checkpoint F: regression, browser verification and documentation
- **Audit of checkpoints A–E against P-023 to P-031:**
  - Starting Gold 3, reset on a new Expedition; Gold carries between rounds and reconciles (3 + earned − spent).
  - The six-slot Tavern is generated only on creation, on continue and on an accepted reroll.
  - Prices equal the proposed cost ranks and are marked provisional.
  - Purchases and rerolls spend only through `applyGoldChange`; no other code changes Gold (also enforced by a source-scan test).
  - Owned Champions and all six reserved reward Champions are never offered.
  - The 12 cap applies to purchases and Champion rewards; the 3-Gold reward stays available at the cap.
  - Reward bundles and values are unchanged; fielding stays 1–3.
  - No selling, combining, levels, interest, streaks, XP or multiplayer code exists (only comments saying they are excluded).
  - Rejected actions return the identical state and never advance the shop number.
  - The P-029 derivation is unchanged (root = output 5; shop k = output k+1).
  - The engine and roster data are unchanged since `main`.
  - **No rule violations found.**
- **Gaps closed (tests):**
  - New `m4-regression.test.ts`: the 12-Champion reward state reached by real play with seed 79 (cheapest purchases and 3-Gold rewards, no Gold injected), with purchase refusals that must name the cap; restart after purchases equals a fresh Expedition and replays identically; and a property test with random actions of every type over 80 seeds (over 1,000 rejections, each returning the identical state; accepted actions advance the shop number only for continue, reroll and new Expedition).
  - The browser smoke test gains the same seed-79 path: 12 owned, "Collection full (12)" offers, disabled Champion reward cards, the 3-Gold reward clearing the Expedition, then a restart.
- **Documentation fixed:** `ECONOMY.md` and `GLOSSARY.md` no longer say "not yet implemented"; the roadmap's M4 status now says implemented and tested but not merged; `CHAMPIONS.md` notes that the full-game shared pool, selling and combining are not in the prototype. Provisional and prototype labels are unchanged; nothing was promoted to a final rule.
- **Results:** see the checkpoint F report.

### 2026-10-12 — Canonical rulebooks (documentation milestone)
- **Scope:** documentation only, from `main` at `d7794fc`. No game mechanic, Champion data, balance value, test or published artifact changed.
- **Created:** `docs/rules/00-INDEX.md` and rulebooks 01–12 (core rules, match structure, combat engine, Champions with the common ability-specification format, Traits, Fame and Renown, Tavern and economy, Monster encounters and rewards, PvP and elimination, full match flow, determinism contracts, unresolved decisions). Every rule carries a design status (APPROVED DESIGN / PROVISIONAL / DRAFT / PROPOSED / UNRESOLVED) and an implementation tag (IMPLEMENTED / PROTOTYPE / NOT IMPLEMENTED) verified against the source.
- **Decisions recorded:** D-022 to D-028 and P-032 from the owner's 2026-10-12 brief. Values the brief calls approved but that no project record contains (Fame thresholds and round rewards, Tavern rank unlocks and probabilities, the exhausted-rank fallback) are UNRESOLVED (U-01 to U-04), not reconstructed. D-023 (Renown starts at 3) supersedes the earlier "begins at 1"; confirmation requested (U-05).
- **Also updated:** pointers in `docs/GAMEPLAY/*` and `GLOSSARY.md`; `OPEN_QUESTIONS.md` (rulebook decision queue); `ROADMAP.md` (full-game roadmap G0–G11, PROPOSED, and stale M3/M4 merge statuses corrected); `CLAUDE.md` and `README.md` (project map).
- **Checks:** `npm run check` (engine 20 files / 449 tests, web 14 files / 147 tests, all passing); `npm run content-check` PASS (0 failures, 11 known warnings); `npm run content-check:test` OK (20 tests); `npm run roster:check` PASS; `npm run build` passes. A script confirmed that every U-ID and rule ID referenced in the rulebooks is defined, and that every relative link and cited file path exists.
- **Next:** owner decision pack G0, then G1 (match economy and progression kernel); see `ROADMAP.md`.

## Required end-of-task report
- Milestone and scope
- Files changed
- Commands/checks run and exact results
- Acceptance criteria passed/failed
- New decisions or unresolved blockers
- Next smallest recommended task
