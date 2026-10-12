# 11 — Determinism and Technical Contracts

Tags and conventions: see [00 — Index](00-INDEX.md). Short engine paths (for example `rng/dice.ts`) are relative to `packages/engine/src/`; short test names are in `packages/engine/test/` unless a path is given. The combat random-draw order is canonical in `docs/COMBAT/PROTOTYPE_RULESET_V0.md` §9. This rulebook covers everything around it.

## 1. Random number generation

| ID | Contract | Design status | Implementation |
|---|---|---|---|
| DET-01 | All randomness comes from in-repository sfc32 (PractRand reference). Seed is a uint32 (`b` = seed, `a` = `c` = 0, counter = 1), followed by 12 warm-up outputs that are not draws. `Math.random`, clocks and ambient randomness are forbidden in rules code. | PROVISIONAL (P-009) | IMPLEMENTED `packages/engine/src/rng/sfc32.ts`; pinned by `rng.sfc32.test.ts` |
| DET-02 | **Die rolls** use rejection sampling: `limit = 2³² − (2³² mod sides)`. Draw `u`, repeat while `u ≥ limit`, result `(u mod sides) + 1`. This method is part of the replay contract. | PROVISIONAL (P-009) | IMPLEMENTED `rng/dice.ts` (`rollDie`) |
| DET-03 | `BattleRng` wraps sfc32 and counts draws. One generator per battle. Nothing outside the battle draws from it. | PROVISIONAL (P-009) | IMPLEMENTED `rng/rng.ts` |
| DET-04 | The order of random-number consumption is part of the contract. Changing it breaks recorded replays and needs an owner decision. | PROVISIONAL (P-009, I-6, P-014) | IMPLEMENTED; see Ruleset §9.2 |

## 2. Seed derivation — prototype Expedition (IMPLEMENTED)

Every derivation builds a **fresh** generator from its root. No generator is stored in state, so no derivation can disturb another.

| ID | Stream | Derivation | Source | Code |
|---|---|---|---|---|
| DET-10 | Battle seed for encounter *i* (0-based) | output *i* + 1 of `Sfc32(expeditionSeed)` (outputs 1–3) | P-018 | `encounterSeed` (`expedition.ts`) |
| DET-11 | Roster draw (4 bench + 6 reward Champions) | `BattleRng(output 4 of Sfc32(expeditionSeed))`; partial Fisher–Yates over the roster in ID order | P-022 | `drawRosterChampions` |
| DET-20 | Shop root *R* | output 5 of `Sfc32(expeditionSeed)` | P-029 | `shopRootSeed` (`shop.ts`) |
| DET-21 | Shop number *k* (0-based) | `BattleRng(output k + 1 of Sfc32(R))`; partial Fisher–Yates over the eligible candidates in roster order | P-029 | `shopSeed`, `generateShop` |
| DET-22 | Shop numbering | Shop 0 is generated at creation. Each successful refresh or reroll uses the next *k*. A rejected action never uses a number. | P-029 | `nextShopNumber` |
| DET-23 | Collision guard | Content whose encounter count would push the roster draw to output ≥ 5 is refused. | P-029 | `contentProblems` |

## 3. Seed derivation — full match (NOT IMPLEMENTED)

| ID | Contract | Design status |
|---|---|---|
| DET-30 | Each match has one match seed. Every random choice in the match is derived from it. | PROVISIONAL (P-009) |
| DET-31 | Each battle's seed is derived from the match seed, the Round number and the pairing. | PROVISIONAL (P-009); the exact derivation is UNRESOLVED (U-24) |
| DET-32 | The streams a full match needs: battle seeds per (Round, pairing); pairing; Tavern per (player, shop number); reward options per (player, Monster Round); bundle generation; Route generation; Run-End Upgrade options; bot decisions. | UNRESOLVED (U-24). **PROPOSED approach:** one fresh, independently derived sub-stream per named purpose and index, following the DET-10 to DET-21 pattern. Never one shared mutable generator. Each stream has a pinned test. |
| DET-33 | The Expedition derivation (DET-10 to DET-23) is prototype-only. It must not be reused for a match without a decision, because its output-index scheme does not scale to 23 Rounds and 8 players. | PROPOSED |

## 4. State transitions

| ID | Contract | Design status | Implementation |
|---|---|---|---|
| DET-40 | **One pure transition function**, `transition(state, action, content)`. It never mutates its input. The same state, action and content always give the same result. | PROVISIONAL (M2–M4 pattern) | IMPLEMENTED `apps/web/src/game/expedition.ts` |
| DET-41 | **A rejection is the identity.** A rejected action returns `{ ok: false, state }` with the **same state object**, plus an error message and optional details. Gold, the collection, the shop and all numbering are unchanged. | PROVISIONAL | IMPLEMENTED; tested in `purchase.test.ts` (`toBe` identity) |
| DET-42 | **Phase gating.** Each action is accepted in exactly one phase. Any other phase gives the wrong-phase rejection. | PROVISIONAL | IMPLEMENTED `wrongPhase` |
| DET-43 | The battle runs inside `startBattle` and its result is stored in state. Presentation (playback) reads only the stored event log. | PROVISIONAL | IMPLEMENTED `startBattle`, `apps/web/src/game/battleView.ts` |
| DET-44 | **Invariant checkers.** These run in tests after every step: `goldAccountProblems`, `economyStateProblems` (cap, uniqueness, shop size, prices, reservations) and `formationProblems`. | PROVISIONAL | IMPLEMENTED |
| DET-45 | The full match uses the same pattern: actions per player, server-authoritative validation (T-003 PROPOSED), and an identical state for a rejected action. | PROPOSED | NOT IMPLEMENTED |

## 5. Validation

| ID | Contract | Implementation | Command |
|---|---|---|---|
| DET-50 | Battle input validation: unit counts, slots, stats within safety limits, attack speed in thousandths, ratios in basis points, dice grammar. Done before any draw. | `packages/engine/src/validate.ts` | `npm run check` |
| DET-51 | Content check (T-009): every JSON file under `docs/` parses; schemas compile (Draft 2020-12); templates and examples validate. Known data issues are warnings, not failures. | `tools/content_check.py` | `npm run content-check`, `npm run content-check:test` |
| DET-52 | The roster matches its source workbook, and its structure is valid (135 Champions, 9 per Trait, unique combinations, canonical names, no Multi-Class). | `tools/import_roster.py --check`; `apps/web/src/game/roster.ts` | `npm run roster:check`; `npm run check` |
| DET-53 | Economy settings and content: the cap is ≥ the starting collection and ≥ the fielding limit; a shop can always be filled; there are exactly 3 bundles per encounter. | `economyConfigProblems`, `contentProblems` | `npm run check` |

## 6. Replay and logs

| ID | Contract | Design status | Implementation |
|---|---|---|---|
| DET-60 | The battle event log is typed and ordered. Event types: `battleStart`, `sidesAssigned`, `initiativeRolled`, `initiativeResolved`, `overtimeStep`, `attackSkipped`, `attackCommitted`, `attackResolved`, `unitDefeated`, `battleEnd`. | PROVISIONAL (M1) | IMPLEMENTED `battle/events.ts` |
| DET-61 | **Canonical serialisation.** Keys are sorted, there is no whitespace, numbers are safe integers only, and anything else throws. Tests hash the serialised log with SHA-256. Golden replays pin those hashes. | PROVISIONAL (M1) | IMPLEMENTED `log/serialize.ts`; `test/support/sha256.ts`; `golden.test.ts` |
| DET-62 | The same seed and input give an identical log and hash, checked over 100 repeated runs. | PROVISIONAL (M1 acceptance 2) | IMPLEMENTED `replay.test.ts` |
| DET-63 | **Seed baseline.** Existing seeds keep identical battle seeds, benches, reward draws and battle logs across milestones. Any change must be deliberate and approved. | PROVISIONAL (P-029 acceptance) | IMPLEMENTED `apps/web/test/seed-baseline.test.ts`, `m4-regression.test.ts` |
| DET-64 | **Arithmetic.** Integers only in authoritative state. Damage is an exact fraction (BigInt), floored once. No transcendental functions. | PROVISIONAL (I-9) | IMPLEMENTED `rules/damage.ts` |

## 7. Required tests for new systems

Every new random stream needs:
- a pinned-output test against independently computed sfc32 outputs;
- a test that every existing stream is unchanged;
- a replay test of the whole flow that uses it.

Every new action needs:
- a test of each rejection reason, showing the identical state is returned;
- a mutation check: removing each guard makes a test fail.
