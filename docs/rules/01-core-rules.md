# 01 — Core Rules and Terminology

Tags and conventions: see [00 — Index](00-INDEX.md). Term definitions: `docs/GLOSSARY.md`; this rulebook does not repeat them.

## 1. The game in one paragraph

Dungeons & Champions is a browser-based, D&D-inspired auto-battler for eight players.
- In each Round, players prepare a team of Champions; battles then resolve automatically.
- Between battles, players spend Gold in their Tavern, gain Fame (which raises Renown, and Renown sets how many Champions they may field), and choose rewards after Monster Rounds.
- Losing a PvP Round costs player Health. A player at 0 Health is eliminated.
- The last player standing wins and then fights a solo Dragon.

## 2. Objectives and governing rules

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| CORE-01 | The game is an eight-player, browser-based auto-battler with automated battles. | APPROVED DESIGN | NOT IMPLEMENTED (the prototype is single-player) | D-001 |
| CORE-02 | Each player starts with 100 Health. A player at 0 Health is eliminated. The last player standing wins the match. | APPROVED DESIGN | NOT IMPLEMENTED | D-006 |
| CORE-03 | The match winner then fights one solo Dragon encounter. Its rules and consequences are UNRESOLVED (U-23). | APPROVED DESIGN (existence only) | NOT IMPLEMENTED | D-007 |
| CORE-04 | Players may spectate or select any player at any time, including after elimination. | APPROVED DESIGN | NOT IMPLEMENTED | D-008 |
| CORE-05 | Gameplay information is public. Each player's Tavern interaction is private, but Tavern offers are visible to all and do not reserve shared-pool copies. | APPROVED DESIGN | NOT IMPLEMENTED | D-009 |
| CORE-06 | Design target: a match spans **five Floors and 23 Rounds**. Elimination decides the actual length: the match ends as soon as one player remains (CORE-02), which may be before Round 23. | APPROVED DESIGN (target) | NOT IMPLEMENTED | D-022 |
| CORE-07 | Intended match length is about 40 minutes. Battles between even teams should present for about 20–30 seconds. | DRAFT | NOT IMPLEMENTED | `PROJECT_BRIEF.md`, `GAMEPLAY/MATCH_FLOW.md` |
| CORE-08 | Losing a Round ends the player's **Run** (win streak) but does not by itself eliminate them. Run loss and elimination are distinct. | DRAFT | NOT IMPLEMENTED | `GAMEPLAY/ECONOMY.md`, `GAMEPLAY/MATCH_FLOW.md` |

## 3. Player resources at a glance

Each resource has one canonical rulebook.

| Resource | Starts at | Canonical rulebook |
|---|---|---|
| Health | 100 (APPROVED DESIGN, D-006) | [09](09-pvp-health-elimination.md) |
| Gold | 3 (PROVISIONAL, P-032) | [07](07-tavern-economy.md) |
| Fame | UNRESOLVED (U-01, U-02) | [06](06-fame-renown.md) |
| Renown | 3, maximum 12 (APPROVED DESIGN, D-023) | [06](06-fame-renown.md) |
| Owned Champions | starting collection UNRESOLVED (U-12); cap 12 (APPROVED DESIGN, D-027) | [07](07-tavern-economy.md) |
| Run (win streak) | 0 (DRAFT) | [09](09-pvp-health-elimination.md) |
| Items and Components | none (DRAFT) | [04](04-champions.md) §8 |

## 4. Governing engineering principles (binding on every implementation)

These come from `CLAUDE.md` and the approved development approach (D-016). They apply to every mechanic in every rulebook.

| ID | Principle | Status | Implementation |
|---|---|---|---|
| CORE-10 | Game rules and combat simulation are independent of UI code. Only `apps/web/src/ui` touches the browser. | APPROVED DESIGN (D-016; T-010 for the prototype) | IMPLEMENTED: `packages/engine`, `apps/web/src/game` (purity tests: `packages/engine/test/purity.test.ts`, `apps/web/test/purity.test.ts`) |
| CORE-11 | Combat is deterministic for a fixed seed and input state. No ambient randomness and no clocks in rules code. | APPROVED DESIGN (D-016); mechanism PROVISIONAL (P-009) | IMPLEMENTED: see [11](11-determinism-contracts.md) |
| CORE-12 | Every state change goes through one pure transition function. A rejected action returns the unchanged state and a message. | PROVISIONAL (M2–M4 pattern) | PROTOTYPE: `apps/web/src/game/expedition.ts` `transition` |
| CORE-13 | Every tunable number lives in one configuration module, not in engine logic. | PROVISIONAL (M1 acceptance 5) | IMPLEMENTED: `packages/engine/src/config.ts`, `apps/web/src/game/config.ts` |
| CORE-14 | Authored content is validated against the canonical JSON Schemas in `docs/COMBAT/schemas/`. | PROPOSED as an architecture rule (T-004); applied in practice (T-009, D-021) | IMPLEMENTED: `tools/content_check.py`, `tools/import_roster.py`, `apps/web/src/game/roster.ts` |
| CORE-15 | No PROPOSED, DRAFT or UNRESOLVED rule is implemented as a rule. PROPOSED content may be **shown** as a labelled proposal, never **executed**. | APPROVED DESIGN (`CLAUDE.md`, D-021) | IMPLEMENTED for the roster: proposed ability text is never executed (`apps/web/src/game/champions.ts`) and is displayed under "Proposed abilities (not implemented)" (`apps/web/src/ui/app.ts`) |

## 5. Full game versus the prototype

The repository currently contains:
- a headless combat engine (M1);
- a **single-player Expedition** prototype (M2–M4).

| Area | Full game (intended) | Prototype today (implemented) |
|---|---|---|
| Players | 8, simultaneous | 1 |
| Match shape | 5 Floors, 23 Rounds, Monster and PvP Rounds (CORE-06) | Up to 3 Monster Rounds ("Expedition"; P-018) |
| Player Health | 100, loss damage after PvP defeats | Not modelled. A defeat or draw ends the Expedition. |
| Gold | 3 start, 5 per Round (P-032); interest and streaks UNRESOLVED (U-07) | 3 start, income only from reward bundles (P-025, P-026) |
| Fame / Renown | Fame → Renown 3–12; Renown = fielding capacity | Not implemented. Fielding limit fixed at 1–3 (P-020). |
| Tavern | 6 slots refreshed every preparation, 2-Gold reroll, rank unlocks and odds, shared pool | 6 slots, refreshed each Monster Round, 2-Gold reroll, uniform draw, price = PROPOSED cost rank (P-023, P-024) |
| Ownership | Cap 12, no selling (D-027) | Cap 12, no selling (P-027) |
| Monster rewards | Three bundles (Gold, Components, Champions); 6 fresh reserved Champion options per Monster Round (D-026) | Three fixed bundles; 2 Champion options per round, 6 drawn at start (P-019, P-022, P-031) |
| Champions | 135 with full kits, levels 1–10, Feats, Items | 135 roster identities; temporary Role stats; one shared fixture Basic Attack (P-022) |
| Combat | Full rules (abilities, resources, statuses, damage types) | Basic Attacks only (P-001 to P-017) |
| Traits | Brackets with effects | Shown only; no effects |

A prototype rule (P-018 to P-031) never settles a full-game rule. Each rulebook keeps the two apart.

## 6. Systems without their own rulebook yet

These systems have no dedicated rulebook yet. Their current canonical source is listed here, and rulebook 12 tracks their gaps.

| System | Canonical source | Notes |
|---|---|---|
| Items and Components | `docs/GAMEPLAY/ITEMS.md`; D-010 to D-012 | Summary in [04](04-champions.md) §8. |
| Floor Routes | `docs/GAMEPLAY/DUNGEON_AND_REWARDS.md` | Summary in [02](02-match-structure.md) §4. |
| Run-End Upgrades | `docs/GAMEPLAY/ECONOMY.md` | Summary in [09](09-pvp-health-elimination.md) §5. |

## 7. Required tests (cross-cutting)

These tests already exist and must keep passing:
- The engine and the game logic import no DOM, Node or clock APIs (`purity.test.ts` in both packages).
- Every tunable value is read from configuration. Configuration validators reject bad values: `apps/web/test/economy-state.test.ts` and `packages/engine/test/validate.test.ts`.
