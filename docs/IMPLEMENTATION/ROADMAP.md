# Implementation Roadmap

Build in small vertical slices. Every milestone should end with a runnable result, passing checks and a concise report.

## M0 — Specification and repository foundation
**Goal:** make the documentation and project conventions reliable.
- Commit this package.
- Audit schemas and examples.
- Approve/amend architecture proposal.
- Finalize a minimal draft combat contract for the first slice.
- Add `CLAUDE.md`, `OPEN_QUESTIONS.md`, `DECISIONS.md`.
**Acceptance:** docs are present; statuses are explicit; schema/examples validate or failures are documented; no rule is silently invented.

**M0 status (2026-10-11):** package committed, audited, reorganised into `docs/`, and provisional prototype rules P-001 to P-010 recorded. Interpretations I-1 to I-9, the Ultimate timing model P-011, Health clamping P-012, Ultimate-first same-timestamp resolution P-013 and commitment-time dice P-014 were accepted on 2026-10-11. The M1 readiness decisions were approved the same day: M1 stack T-008 (TypeScript + Vitest), fixture Basic Attack P-015, content-check rules T-009, and targeting/defeated-attacker rules P-016. No owner decision remains open before M1 coding. Schema fixes listed in `docs/OPEN_QUESTIONS.md` are not required for M1.

## M1 — Headless deterministic duel (basic attacks only)
**Goal:** prove the engine can run a complete, reproducible battle using only the PROVISIONAL rules in `docs/COMBAT/PROTOTYPE_RULESET_V0.md`.

**In scope**
- Minimal TypeScript engine package with Vitest (T-008); `npm run check` runs type-checking and the tests. No React, Vite, server, browser UI or multiplayer.
- Integer-millisecond event scheduler (P-002) and seeded PRNG (P-009).
- Dice parsing and rolling (`NdM`, `NdM+K`, `NdM-K`).
- Two sides of 1–5 test units on the P-003 board, using P-007 Role-table stats for battle-level tests (custom stat blocks allowed in focused unit tests) and the shared P-015 fixture Basic Attack (`1d8 + Attack × 1.0`, physical).
- Initiative totals, opening-Ultimate winner recorded in the log only, and the bottom-half first-attack skip (P-008).
- Basic Attacks only: P-003 and P-016 targeting (only non-defeated Champions occupy slots; defeated Champions commit no new attacks), P-004 hit roll, standard natural 1/20, one physical damage type with P-005 damage and Armor mitigation.
- Defeat, Health clamping at 0 with excess damage logged separately (P-012), commit-then-resolve handling of same-timestamp Basic Attacks with dice rolled and stored at commitment (P-006, P-013 Basic Attack stages, P-014), draws, provisional overtime and the 60-second hard cap (P-006); P-010 ordering.
- Typed, ordered event log and a log hash.
- A small content check of the existing schemas, templates and examples, with the T-009 pass/fail rules (acceptance item 7).

**Excluded:** Ultimates (beyond recording the opening winner), Class Resources, Rogue/Sorcerer critical rules, statuses and catalogue effects, saving throws, death saves, Magic Resistance and non-physical damage, Traits, Items, levels, Feats, economy, shop, players, UI, networking and real roster content.

**Acceptance**
1. `npm run check` (typecheck + tests) passes.
2. The same seed and input produce an identical event log and hash across 100 repeated runs.
3. Different seeds produce different logs in at least one of several sampled cases.
4. 1,000 seeded random battles all end as win, loss or draw by the hard cap; no hangs; Health is never below 0, either in the authoritative state or in any Health value in the event log. Damage beyond remaining Health appears only as a separate excess-damage value (P-012).
5. All tunable numbers live in one config module.
6. The engine imports nothing from the DOM, Node I/O or clocks.
7. The content check (T-009) passes, reporting schema-validation failures separately from known content-data warnings:
   - **Fails** on invalid JSON in any of the JSON files under `docs/`; any schema in `docs/COMBAT/schemas/` that is not a valid, compilable JSON Schema (Draft 2020-12); or any template or example that fails validation against its applicable schema. Applicable schemas: `templates/ability-template.json`, `examples/rogue_critical_passive.json` and `examples/storm_vanguard.json` (a basic-attack ability) → `ability.schema.json`; `templates/champion-combat-template.json` → `champion-combat.schema.json`; `templates/effect-template.json` → `effect.schema.json`.
   - **Warns, without failing**, on the known missing placeholder references (effects `apply_stagger_on_hit` and `rogue_resource_on_critical`; the champion template's abilities `example_basic_attack`, `example_passive`, `example_ultimate` and Feats `example_feat_a` to `example_feat_d`) and on the known `attack_commit` resolution-window mismatch in `templates/ability-template.json` and `examples/storm_vanguard.json`.
   - Uses the existing Python `jsonschema` tooling if suitable; no new validator dependency without concrete justification and approval.

**Required tests:** dice parser and ranges; known-seed PRNG sequence; natural 1/20 and the exact-AC boundary; exact damage values including rounding and the minimum of 1; bottom-half skip for N = 1–4 with boundary ties; mutual defeat at one timestamp gives a draw; lethal damage clamps Health to 0 and records the excess separately; a committed attack still resolves against its original target, with its stored outcome, when attacker or target falls at the same timestamp; random-number draw sequence for a known seed matches `docs/COMBAT/PROTOTYPE_RULESET_V0.md` section 9.2 exactly (side assignment, initiative, then per timestamp each committed attack's d20 and, on a hit only, its damage dice), with no draws at resolution; each stored outcome, including the calculated damage on a hit, is identical at commitment and at resolution; Health is unchanged by commitment and changes only at resolution; a miss draws no damage dice; target selection skips slots holding only defeated Champions; a Champion defeated at an earlier moment commits no further attacks and draws no random numbers, while an attack it committed before falling still resolves; the fixture Basic Attack's base damage amount is `1d8 + Attack`, after which critical hit ×2, Armor mitigation, overtime multiplier, one round-down and the minimum of 1 apply in that order (P-005); seeded runs with several attacks at one timestamp are reproducible across repeated runs (identical log hash); overtime steps and hard-cap draw; stable same-timestamp ordering; a golden-replay hash for a fixed fixture.

**M1 status (2026-10-11):** implemented and tested on branch `claude/modest-hamilton-ngoiru` (commits `b51b15c` to `6ab2585`, plus the step 9 report `007df48`); merged into `main` through PR #5 (merge commit `1fafb5a`). All seven acceptance criteria are met: `npm run check` passes (20 files, 449 tests, including the 1,000-battle stress test and three golden replays); `npm run content-check` passes with 0 failures and the 11 documented, non-fatal content-data warnings. Item 5 is verified by review rather than an automated check. Scope is unchanged: Basic Attacks only, with Ultimates and everything else in the exclusion list still deferred. Details, commands and caveats: `docs/PROGRESS.md`, "M1 headless deterministic duel (implementation)".

## M2 — First playable Expedition (browser)
**Goal:** a small, complete, browser-playable loop on top of the M1 engine: prepare a team, watch a battle, take a reward, choose what to do next, and finish or restart. Redefined by the owner on 2026-10-11 (T-010); it replaces the former M2 (now M3) and absorbs the former browser milestone.

**In scope**
- `apps/web`: plain TypeScript + DOM, built and served by Vite (T-010). Game logic in `apps/web/src/game` (pure, no DOM, no Node, no clocks); rendering in `apps/web/src/ui`.
- Fixture content only (P-021): seven Role-table fixture Champions and three fixture Monster Rounds.
- Team preparation: a starting bench of four, field 1–3 Champions in legal slots (P-020, P-003, I-1); invalid teams cannot start.
- Battle through the M1 engine (`runBattle`), with the seed derived from the Expedition seed (P-009, P-018); playback, Health bars and combat log read from the engine log only.
- Reward: one of three fixed bundles after each victory (P-019); defeat or draw ends the Expedition (P-018).
- Next choice after a reward: continue to the next Monster Round or end the Expedition; a clear after the third Monster Round; a working restart.

**Excluded:** shop, Gold spending, Renown, player Health, PvP, bots, Items and Components, Traits, Ultimates and everything else excluded from M1, persistence across page reloads, real roster or Monster content.

**Acceptance (owner's M2 brief, AC-01 to AC-12):** the application builds and runs; team preparation works and invalid teams cannot start; battles use the real engine; the outcome is understandable; a reward is applied exactly once; the next choice works; the Expedition can finish and restart with no stale state; invalid states give clear feedback; determinism is preserved; automated tests pass; production build and a browser smoke test pass; documentation is accurate.

**M2 status (2026-10-11):** implemented, tested and merged into `main` through PR #6 (merge commit `b00e885`). `npm run check` passes (engine 449 tests, web 52 tests), `npm run build` passes, and the browser smoke test (`apps/web/scripts/smoke.mjs`, 30 checks in Chromium) passes. Details, how to run it and the limitations are in `docs/PROGRESS.md` under "M2 first playable Expedition (implementation)".

## M3 — Approved 135-Champion roster
**Goal:** replace the prototype's placeholder Champions with the approved roster (D-017 to D-021) while keeping M1 and M2 behaviour. Defined by the owner on 2026-10-11; later milestones were renumbered (economy M4 … deployment M9).

**In scope:** a single roster data file imported from the approved workbook; strict validation (135 Champions, unique IDs and combinations, 9 per trait, canonical names, no Multi-Class); roster Champions in the Expedition with temporary combat numbers and a documented Basic Attack fallback (P-022); documentation reconciled with the approved decisions.

**Excluded:** Trait effects and bracket bonuses, economy, shop, purchases, rerolls, upgrades, Multi-Class, Champion-specific ability execution, changes to the bench of four or the 1–3 fielding limit, changes to the engine's rules.

**M3 status (2026-10-11):** implemented and tested on branch `claude/modest-hamilton-ngoiru` (checkpoints A–D); not yet reviewed or merged. Results and caveats: `docs/PROGRESS.md`, "M3 approved roster integration".

## M4 — Minimal economy and bot match
**Goal:** demonstrate a complete small match loop. (Formerly M2, then M3; renumbered by T-010 and again when the roster milestone became M3. The former M3 browser goals of showing the shop, Gold and Health are carried here because the browser client now exists.)
- Add two players, placeholder shop, buy/sell/reroll and Gold checks.
- Add one simple heuristic bot.
- Add player Health and match-end logic.
- Show the shop, Gold and player Health in the existing `apps/web` client; keep rules out of the UI.
**Acceptance:** no overspending; shared-pool counts reconcile; matches terminate with exactly one winner or documented draw; seeded batch tests pass; a browser smoke test covers buying and fielding a unit and starting a battle with no console errors.
Needs the economy values in `OPEN_QUESTIONS.md` B5 (or approved PROVISIONAL values) first.

## M5 — Core combat systems
Add validated effects, role targeting, Class Resources, Ultimates (including the opening bonus Ultimate and the Ultimate queue, following the P-011 timing model, with no Basic Attack pauses, and P-013 Ultimate-first same-timestamp resolution), Rogue/Sorcerer critical rules, damage types, defenses, status effects and death/survival rules in separately testable increments. Each needs its open questions in `docs/OPEN_QUESTIONS.md` settled first.
**Acceptance:** each mechanic has schema/content validation and focused tests; deterministic event order maintained.

**Required tests for Ultimates at a shared timestamp (P-013, P-014):**
- A committed Basic Attack keeps its stored target, d20, hit/critical result, damage dice and calculated damage after a ready Ultimate resolves at the same timestamp.
- An Ultimate at the same timestamp cannot change a committed attack's random outcome. For one seed, run fixtures where the Ultimate draws zero random numbers and where it draws several: the committed attack's stored outcome at that timestamp is identical, and the Ultimate's draws come after all commitment draws.
- Seeded runs that include Ultimates are reproducible under the section 9.2 order (identical event log and hash across repeated runs).
- Defeated-attacker and defeated-target rules are preserved. If an Ultimate defeats the attacker or the target after commitment, the committed attack still resolves with its stored outcome against its original target, and Health is clamped at 0 (P-006, P-012, P-013).

## M6 — Roster, Traits, items and progression
The approved roster and its validation were delivered early in M3. Remaining: full combat definitions for roster Champions; add Trait breakpoints, Items, Champion levels and Feats.
**Acceptance:** roster count and taxonomy constraints validate; all content passes schema and semantic checks; no unimplemented effect is presented as functional.

## M7 — Dungeon, routes, Monster rounds and rewards
Add Floor/route progression, Monster Round bundles, Run streaks and Run-End Upgrades after the remaining rules are approved.
**Acceptance:** seeded end-to-end match simulation passes route, reward and persistence invariants.

## M8 — Eight-player multiplayer
Add authoritative server, rooms, WebSocket actions, pairing and odd-player PvE replacement.
**Acceptance:** integration tests cover eight players, reconnect/disconnect behavior, invalid actions, simultaneous round resolution and spectator views.

## M9 — Balance, polish and deployment
Run seeded simulations, tune config values, improve animation/accessibility, handle persistence only as required, and deploy.
**Acceptance:** agreed performance, stability, browser support and match-length criteria pass.

## Implementation discipline
Do not skip milestones. If a milestone reveals a rules blocker, stop at the smallest reproducible case, record it, and ask for the decision instead of inventing a rule.
