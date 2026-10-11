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

**M3 status (2026-10-11):** implemented and tested on branch `claude/modest-hamilton-ngoiru` (checkpoints A–D); owner review decisions R-001 to R-005 recorded; pull request open for review, not merged. Known limitation (R-001): with roster Champions the Expedition clears far less often until Champion mechanics exist. Results and caveats: `docs/PROGRESS.md`, "M3 approved roster integration".

## M4 — Economy and recruitment (prototype Expedition)
**Goal:** a functional Gold economy in the single-player Expedition: a seeded six-slot Tavern, buying roster Champions, and rerolls, under the owner-approved prototype rules P-023 to P-031 (2026-10-11). The M1 engine, battle seeds, the initial bench and reward draw (P-022), monsters and reward bundles stay unchanged.

**Status (2026-10-11):** decisions P-023 to P-031 recorded; implementation plan (checkpoints A–F) **approved by the owner**. **Not yet implemented.** Each checkpoint is reported before the next one starts.

**Excluded:** selling, combining duplicates, Champion levels and XP, interest, base income, win- or loss-streak bonuses, shop odds by rank or level, a shared pool, locking offers, "Play my song", Fame and Renown, monster or reward retuning, any change to the starting four or the 1–3 fielding limit.

**Former M4 scope:** two-player matches, the heuristic bot opponent, player Health and match-end rules were deferred by the owner to the multiplayer milestone (M8), where they are listed.

### Approved rules detail (owner, 2026-10-11)
- **Reserved reward Champions (P-031):** the six Champions drawn for the reward bundles when the Expedition is created (`state.offers`, two per Monster Round; P-022) are all reserved for the whole Expedition, including future rounds' offers and Champions from reward choices already passed up. They are never released within the Expedition. The shop excludes all six, plus every owned Champion.
- **Capacity (12 owned, P-027, P-030):** enforced on every acquisition path. A purchase is refused when 12 are owned. When 12 are owned, the two Champion reward bundles are disabled and the 3-Gold bundle stays available, so every victory has a valid reward choice. The starting four and fielding 1–3 are unchanged.
- **Gold:** 3 when an Expedition is created and on every new Expedition; changed only by reward Gold (+), purchases (−) and rerolls (−2); never negative; carried between rounds; no other income.
- **Shop timing:** shop 0 is generated when the Expedition is created (round 1 preparation). A new shop is generated automatically, free, when the player continues to the next Monster Round. A reroll is allowed only in preparation, costs 2 Gold, and immediately replaces all six slots, including sold ones. No shop activity happens in the battle, reward, decision or ended phases.
- **Purchases:** allowed only in preparation, for an unsold slot, with enough Gold and fewer than 12 owned. The price (proposed cost rank) is taken, the Champion joins the collection as a new instance (not placed on the board), and the slot is marked sold.
- **Rejections:** wrong phase, invalid slot, sold slot, too little Gold, or a full collection return the same, unchanged state object with a message. A rejected purchase or reroll never changes Gold, the collection, the shop offers or the shop numbering (a rejected reroll does not use up a shop number).
- **Shop contents:** eligible Champions are the roster in ID order, minus owned, minus reserved (at least 135 − 12 − 6 = 117, so six can always be drawn). Six are drawn without repeats by a partial Fisher–Yates shuffle using the engine's `rollDie`. Each slot's price is that Champion's proposed cost rank.
- **Random stream (P-029, approved in principle):** every existing derivation builds a fresh sfc32 generator from the Expedition seed, so no generator is stored in the state and nothing is consumed from a shared mutable generator. Outputs 1–3 of `Sfc32(expeditionSeed)` are the battle seeds, and output 4 seeds the roster draw. The shop stream root is **output 5** of a fresh `Sfc32(expeditionSeed)`, called *R*. Shop number *k* (0-based, counting every shop generated in the Expedition in order: shop 0, then each refresh and reroll) is drawn with `new BattleRng(seed_k)`, where *seed_k* is output *k* + 1 of a fresh `Sfc32(R)`. The state stores only the next shop number *k* and the current slots. The existing functions (`encounterSeed`, `drawRosterChampions`) are not modified. Only a successful shop generation (shop 0, a refresh on continuing, or an accepted reroll) advances *k*. The derivation is documented in the code and in the tests. **Acceptance condition set by the owner:** tests must show that, for existing seeds, battle seeds, the starting bench, the reward draws and existing battle logs are unchanged.
- **Seeded replay:** the state machine stays pure. The same Expedition seed and the same action sequence give the same shop numbers, the same owned and reserved sets at each generation, and therefore identical shops, purchases, battles and outcomes. Existing seeds keep identical battles and benches for the same actions.

### Approved checkpoints (owner, 2026-10-11)
**A. Economy configuration and state model** (done 2026-10-11, commit `8a78e42`, approved by the owner)
- **Modules:** `apps/web/src/game/config.ts` (shop slots 6, reroll cost 2, owned cap 12); a new `shop.ts` (shop types, empty shop, settings validation); `expedition.ts` (state fields `shop` and `nextShopNumber`; the reserved-reward set; an economy consistency checker; the content check now includes the settings and whether a shop can always be filled). The cost rank 1–5 is already enforced by the roster validator (M3). Starting Gold 3 moved to checkpoint B, which the owner's checkpoint list names "Starting Gold and single-path Gold accounting".
- **Edge cases:** invalid configuration values; a slot count larger than the eligible pool.
- **Tests:**
  - configuration and content validation reject bad values;
  - a new Expedition has no shop yet and shop number 0;
  - restarting resets the shop and the shop number;
  - a pre-M4 seed baseline (battle seeds, bench, reward draws, round-1 log hash) is pinned.

**B. Starting Gold and single-path Gold accounting** (done 2026-10-11, commit `3f81232`, approved by the owner)
- **Modules:** one Gold helper, `applyGoldChange` in a new `gold.ts` (income kind `reward`; spending kinds `purchase` and `reroll` prepared but unused until D), used by reward claims; state fields `goldEarned` and `goldSpent`; the reconciliation check in `economyStateProblems`; `startingGold` 3 in `config.ts`.
- **Edge cases:** reward bundles still give 1, 1 or 3 Gold; Gold carries into the next round; restart gives 3 again.
- **Tests:**
  - reward bundle values are unchanged;
  - existing reward and flow tests pass, with Gold expectations raised by 3 (a legitimate change from P-025);
  - Gold equals 3 + reward Gold − spending at every step;
  - Gold is never negative.

**C. Deterministic six-slot shop, provisional prices, refresh timing** (done 2026-10-11, commit `8774c13`, approved by the owner)
- **Modules:** `shop.ts` (`SHOP_ROOT_OUTPUT` = 5, `shopRootSeed`, `shopSeed(k)`, `generateShop`; shop slots carry `priceStatus: 'provisional'`); `expedition.ts` (`shopCandidates`; shop 0 on creation, a refresh on continue; the content check refuses a round count whose roster draw would reach output 5).
- **Edge cases:** owned and all six reserved Champions excluded; refresh only on continue; no shop changes in other phases.
- **Tests:**
  - the same seed and actions give identical shops;
  - shops differ between seeds and between shop numbers;
  - no owned or reserved Champion is ever offered (checked over many seeds);
  - prices equal cost ranks;
  - battle seeds, the bench and reward draw, and the existing seeded battle logs are identical before and after the change;
  - the engine golden replays are unchanged;
  - the derivation (root = output 5; shop *k* = output *k*+1 of `Sfc32(root)`) is documented in `shop.ts` and pinned by a test against independently computed sfc32 outputs.

**D. Purchases, rerolls, capacity, reserved Champions, rejected actions** (done 2026-10-11, commit `823d368`, approved by the owner)
- **Modules:** `expedition.ts` actions `buy` (slot) and `reroll`; the reward-claim capacity guard.
- **Edge cases:** a sold slot; too little Gold for a buy (below the price) or a reroll (below 2); 12 owned (buy refused, Champion reward refused, Gold reward allowed); buying in a non-preparation phase; a double buy; a reroll after buying; buying the last affordable slot.
- **Tests:**
  - every rejected purchase or reroll returns the identical state object: Gold, collection, shop offers and shop number all unchanged, and a rejected reroll does not use up a shop number;
  - at 12 owned, both Champion reward bundles are refused and the 3-Gold bundle is accepted (P-030);
  - no shop ever offers one of the six reserved reward Champions, including ones already passed up (P-031);
  - a buy deducts the price and adds the Champion exactly once;
  - a reroll deducts 2 and replaces all six slots;
  - the cap holds across purchases and rewards;
  - a full-Expedition replay with purchases is deterministic;
  - deliberately breaking each guard makes a test fail.

**E. Browser UI** (done 2026-10-11, awaiting owner review)
- **Modules:** `apps/web/src/ui/app.ts` (a Tavern panel in preparation, Gold display) and `styles.css`.
- **Edge cases:** disabled Buy showing "Need N Gold", "Sold" or "Collection full (12)"; disabled Reroll showing "Need 2 Gold"; prices labelled "Price N Gold (provisional)"; Champion reward bundles disabled at the cap; any rejection message shown.
- **Tests:** the screens type-check, plus the smoke test in F.

**F. Regression tests, browser smoke test, documentation**
- **Checks:** `npm run check` (engine 449 unchanged, plus web), `content-check`, `content-check:test`, `roster:check`, `build`.
- **Browser smoke test:** the shop appears with six priced offers; buying; an unaffordable purchase; a reroll; a double click; restart resets Gold to 3 and the shop; a seeded replay with purchases; 375 px width; no console errors.
- **Docs:** PROGRESS, this roadmap and DECISIONS updated with the measured effect on clear rate (reported, not retuned; R-001).

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
**Deferred here from the former M4 (owner, 2026-10-11):** two-player matches; a simple heuristic bot opponent; player Health and match-end logic; the match shop with buy, sell and reroll and Gold checks against a shared pool; and showing the shop, Gold and player Health for a match, with rules kept out of the UI. They need the economy values in `OPEN_QUESTIONS.md` B5 and the player-damage formula. They may become an earlier sub-milestone if the owner chooses.
**Acceptance:** integration tests cover eight players, reconnect/disconnect behavior, invalid actions, simultaneous round resolution and spectator views. For the deferred match scope: no overspending; shared-pool counts reconcile; matches end with exactly one winner or a documented draw; seeded batch tests pass; a browser smoke test covers buying, fielding a unit and starting a battle with no console errors.

## M9 — Balance, polish and deployment
Run seeded simulations, tune config values, improve animation/accessibility, handle persistence only as required, and deploy.
**Acceptance:** agreed performance, stability, browser support and match-length criteria pass.

## Implementation discipline
Do not skip milestones. If a milestone reveals a rules blocker, stop at the smallest reproducible case, record it, and ask for the decision instead of inventing a rule.
