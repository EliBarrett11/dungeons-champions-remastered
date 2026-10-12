# Dungeons & Champions Rulebooks — Index

**Purpose.** These rulebooks are where a future implementer looks up the rule for a mechanic. Each rule carries its status and a pointer to its source. Where the source is a different document, the rulebook cross-references it instead of copying it. The rulebooks add no rule the owner has not approved. Missing values and conflicts are marked **UNRESOLVED** and gathered in [12 — Unresolved Decisions](12-unresolved-decisions.md).

Created 2026-10-12 from `main` at `d7794fc` (after M4).

## How to read a rule

Every rule has an ID (for example `ECO-04`) and two tags.

**Design status.** Says whether the owner has approved the rule. The labels are from the project vocabulary in `docs/DECISIONS.md`.

| Tag | Meaning | Register equivalent |
|---|---|---|
| **APPROVED DESIGN** | Explicitly agreed by the owner as a game rule. Binding, but not necessarily implemented. | CONFIRMED |
| **PROVISIONAL** | Approved as a baseline for testing or for the prototype. Values live in config. Not a final rule or balance decision. | PROVISIONAL |
| **DRAFT** | Written in the earlier design documents (`docs/GAMEPLAY/`), but not registered as approved in `docs/DECISIONS.md`. It must be confirmed before implementation. For implementation purposes, treat it like PROPOSED. | DRAFT |
| **PROPOSED** | Suggested but not approved. Must not be implemented as a rule. | PROPOSED |
| **UNRESOLVED** | There is not enough information to specify the rule. Listed in rulebook 12. | UNRESOLVED |

**Implementation.** Says what the code does today.

| Tag | Meaning |
|---|---|
| **IMPLEMENTED** `path` | Verified in the source code at the given path and covered by tests. |
| **PROTOTYPE** `path` | Implemented only as a single-player Expedition stand-in. It is not the full-game rule. |
| **NOT IMPLEMENTED** | No code exists. |

The source code is the authority for the implementation tag. `docs/DECISIONS.md` is the authority for the design status. If the two disagree, rulebook 12 records the conflict.

**Scope labels.** Each rulebook keeps two parts apart:
- the **full game**: eight players, Floors, PvP;
- the **prototype**: the single-player browser Expedition built in M2–M4.

The prototype is a foundation, not the game. Its stand-ins never settle a full-game rule.

## The rulebooks

| # | Rulebook | Covers | Rule-ID prefix |
|---|---|---|---|
| 01 | [Core Rules and Terminology](01-core-rules.md) | Concepts, objectives, governing principles, the prototype boundary | `CORE` |
| 02 | [Match Structure](02-match-structure.md) | Players, Floors, Rounds, phases, round transitions, match termination | `MATCH` |
| 03 | [Combat Engine](03-combat-engine.md) | Timeline, initiative, targeting, hit, damage, defeat, simultaneity, ties, battle end | `CMB` |
| 04 | [Champion Rules](04-champions.md) | Roster, Traits, Roles, stats, abilities, Feats, levels, items, and the **ability specification format** | `CHMP` |
| 05 | [Traits and Synergies](05-traits.md) | Trait counts, brackets, activation, stacking | `TRT` |
| 06 | [Fame and Renown](06-fame-renown.md) | Fame sources, thresholds, Renown levels, fielding capacity | `FAME` |
| 07 | [Tavern and Economy](07-tavern-economy.md) | Gold, income, prices, refreshes, rerolls, eligibility, reservations, ownership cap, purchases | `ECO` |
| 08 | [Monster Encounters and Rewards](08-monsters-rewards.md) | Monster Rounds, outcomes, reward bundles, reward reservations | `MON` |
| 09 | [PvP, Player Health and Elimination](09-pvp-health-elimination.md) | Pairing, PvP outcomes, loss damage, Runs, elimination, end of match | `PVP` |
| 10 | [Full Match Flow](10-match-flow.md) | How every system combines, step by step, from match start to the Dragon | `FLOW` |
| 11 | [Determinism and Technical Contracts](11-determinism-contracts.md) | Seeds and streams, state transitions, validation, replay | `DET` |
| 12 | [Unresolved Decisions](12-unresolved-decisions.md) | Every missing, contradictory or unapproved rule that needs owner input, and what each blocks | `U` |

The implementation roadmap (milestone order, dependencies, blocking decisions and the recommended next milestone) is in [`docs/IMPLEMENTATION/ROADMAP.md`](../IMPLEMENTATION/ROADMAP.md), under "Full-game roadmap".

## Canonical sources these rulebooks point to

The rulebooks summarise and organise these sources; they do not replace them.

| Topic | Canonical source |
|---|---|
| Decision register and status vocabulary | `docs/DECISIONS.md` |
| Prototype combat rules, with exact formulas and ordering | `docs/COMBAT/PROTOTYPE_RULESET_V0.md` |
| Combined combat design contract (full game, mostly PROPOSED) | `docs/COMBAT/RESOLUTION_CONTRACT.md` |
| Content schemas | `docs/COMBAT/schemas/*.schema.json` |
| Approved roster data | `content/roster/champions.json` (generated; never edit by hand) |
| Engine tunables | `packages/engine/src/config.ts` (`M1_CONFIG`) |
| Prototype tunables | `apps/web/src/game/config.ts` (`EXPEDITION_CONFIG`) |
| Open questions register | `docs/OPEN_QUESTIONS.md` |
| Term definitions | `docs/GLOSSARY.md` |

The older design documents in `docs/GAMEPLAY/` remain as background. When a rulebook and a `GAMEPLAY/` file disagree, the rulebook states which source wins and why, and records the conflict in rulebook 12.

## Rules for editing the rulebooks

1. **Change process.** A design change starts in `docs/DECISIONS.md` (see its "Change process" section). The affected rulebook is updated in the same change.
2. **One canonical location per rule.** Other rulebooks link to it by rule ID.
3. **Implementation tags must be accurate.** When code changes, update the IMPLEMENTED or PROTOTYPE tag and its file path in the same commit.
4. **No promotion by editing.** Moving a rule from PROPOSED, DRAFT or UNRESOLVED to PROVISIONAL or APPROVED DESIGN needs an owner decision recorded in `docs/DECISIONS.md`.
5. **No guessing.** If a value cannot be traced to a record, mark it UNRESOLVED and add it to rulebook 12.
