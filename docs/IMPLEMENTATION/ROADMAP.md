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

## M2 — Minimal economy and bot match
**Goal:** demonstrate a complete small match loop without UI.
- Add two players, placeholder shop, buy/sell/reroll and Gold checks.
- Add one simple heuristic bot.
- Add player Health and match-end logic.
**Acceptance:** no overspending; shared-pool counts reconcile; matches terminate with exactly one winner or documented draw; seeded batch tests pass.

## M3 — Browser board and playable local prototype
**Goal:** make the engine visible and interactive.
- Add React/Vite client and simple board.
- Display team, shop, Gold, Health, event log and battle outcome.
- Wire UI actions to engine-facing commands; keep rules out of components.
**Acceptance:** browser smoke test loads; a user can buy/field units and start a battle; no console errors in the smoke path.

## M4 — Core combat systems
Add validated effects, role targeting, Class Resources, Ultimates (including the opening bonus Ultimate and the Ultimate queue, following the P-011 timing model, with no Basic Attack pauses, and P-013 Ultimate-first same-timestamp resolution), Rogue/Sorcerer critical rules, damage types, defenses, status effects and death/survival rules in separately testable increments. Each needs its open questions in `docs/OPEN_QUESTIONS.md` settled first.
**Acceptance:** each mechanic has schema/content validation and focused tests; deterministic event order maintained.

**Required tests for Ultimates at a shared timestamp (P-013, P-014):**
- A committed Basic Attack keeps its stored target, d20, hit/critical result, damage dice and calculated damage after a ready Ultimate resolves at the same timestamp.
- An Ultimate at the same timestamp cannot change a committed attack's random outcome. For one seed, run fixtures where the Ultimate draws zero random numbers and where it draws several: the committed attack's stored outcome at that timestamp is identical, and the Ultimate's draws come after all commitment draws.
- Seeded runs that include Ultimates are reproducible under the section 9.2 order (identical event log and hash across repeated runs).
- Defeated-attacker and defeated-target rules are preserved. If an Ultimate defeats the attacker or the target after commitment, the committed attack still resolves with its stored outcome against its original target, and Health is clamped at 0 (P-006, P-012, P-013).

## M5 — Roster, Traits, items and progression
Add Champion data in batches; validate uniqueness and required fields; add Trait breakpoints, Items, Champion levels and Feats.
**Acceptance:** roster count and taxonomy constraints validate; all content passes schema and semantic checks; no unimplemented effect is presented as functional.

## M6 — Dungeon, routes, Monster rounds and rewards
Add Floor/route progression, Monster Round bundles, Run streaks and Run-End Upgrades after the remaining rules are approved.
**Acceptance:** seeded end-to-end match simulation passes route, reward and persistence invariants.

## M7 — Eight-player multiplayer
Add authoritative server, rooms, WebSocket actions, pairing and odd-player PvE replacement.
**Acceptance:** integration tests cover eight players, reconnect/disconnect behavior, invalid actions, simultaneous round resolution and spectator views.

## M8 — Balance, polish and deployment
Run seeded simulations, tune config values, improve animation/accessibility, handle persistence only as required, and deploy.
**Acceptance:** agreed performance, stability, browser support and match-length criteria pass.

## Implementation discipline
Do not skip milestones. If a milestone reveals a rules blocker, stop at the smallest reproducible case, record it, and ask for the decision instead of inventing a rule.
