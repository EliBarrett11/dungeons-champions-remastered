# Open Questions and Implementation Blockers

This list is intentionally honest about gaps. The presence of a proposal elsewhere does not resolve a question.

## Blockers to the first combat engine

| ID | Question | Why it matters | Status / next action |
|---|---|---|---|
| B1 | Is combat presented as real-time ticks or as initiative-based turns? | Defines the simulation clock and feel. | PROVISIONALLY RESOLVED by P-002: timed, event-scheduled simulation on an integer-millisecond timeline. Final confirmation after the prototype. |
| B2 | What is the canonical stat block and exact attack/damage formula? | Required to resolve attacks, defense and scaling. | PARTLY SPECIFIED. Prototype hit and physical damage formulas are PROVISIONAL (P-004, P-005; `docs/COMBAT/PROTOTYPE_RULESET_V0.md`). The canonical final stat list, Magic Resistance and non-physical damage remain unresolved. |
| B3 | What is the board geometry and exact field capacity? | Affects placement, targeting and UI. | PROVISIONALLY RESOLVED for the prototype by P-003: fixed fan formation, 12 slots per side (front 3, middle 4, back 5), no movement, simple frontmost-row targeting. Final board, ranges and role-priority targeting remain unresolved. |
| B4 | How do duplicate combining, fielding progression, experience, level caps and selling interact? | Affects roster, economy and persistence. | PARTLY SPECIFIED. See `docs/GAMEPLAY/CHAMPIONS.md`. |
| B5 | What are exact Gold/Fame/Renown starting values, incomes, prices and player damage formula? | Required for a complete match loop. | PARTLY SPECIFIED. Confirmed relationships are documented; numeric balance values may remain TUNABLE. |
| B6 | What are the exact Trait effects, stack rules, and interactions? | Required for synergies and final content. | UNRESOLVED at content level. Trait taxonomy and breakpoint targets are known. |
| B7 | What is the full Floor route and 8-player PvP/PvE schedule? | Required for full match progression. | PARTLY SPECIFIED. Floor 1 has three Monster Rounds before the first PvP Round. Later structure needs approval. |
| B8 | What exactly persists when a Run ends, and how are upgrades selected and scaled? | Required for run-end progression. | PARTLY SPECIFIED. Core persistence behavior is known; tier thresholds and upgrade catalogue need definition. |

## Additional rules to settle before their relevant milestones

### Prototype ruleset interpretations (confirm before or during M1)
The approved provisional rules P-001 to P-010 left some implementation details open. `docs/COMBAT/PROTOTYPE_RULESET_V0.md` §11 records the interpretation chosen for each; please confirm or change:
- I-1 Board slot numbering (front 0–2, middle 3–6, back 7–11).
- I-2 Basic Attack interval `round(1000 / attacks per second)` ms; first attack after one full cycle.
- I-3 Exact overtime multiplier per 5-second step (×2 from 30 s).
- I-4 Whether actions at exactly 60 000 ms resolve before the hard cap.
- I-5 Which team counts as "side A" in tie-breaks.
- I-6 Random-number consumption order; critical hits multiply rather than roll extra dice.
- I-7 Test units use Initiative Modifier +0.
- I-8 Retargeting when a target is defeated.
- I-9 Floating-point limits for outcome-affecting arithmetic.

### Combat
- Exact event ordering for simultaneous damage, death checks and triggers beyond the prototype (P-002/P-006/P-010 cover Basic Attacks only).
- Whether Basic Attack timers of **all** Champions pause during an Ultimate, or only the caster's (C-009 is silent).
- When the opening bonus Ultimate fires, and what `opening_bonus_ultimate_eligible` in the ability schema means (no decision says some Ultimates are ineligible).
- Rogue critical range: does a natural 16–19 crit when the attack would otherwise miss? (Sorcerer has an explicit rule; Rogue does not.)
- Sorcerer "qualifying" criticals and misses: do automatic natural 1–2 misses count?
- Class Resource generation events and targets for the nine classes not yet described (only Barbarian, Rogue and Sorcerer are).
- Final role-priority targeting table, attack ranges, and the meaning of `highest_threat`.
- Exact stat list and canonical derivation of Armor Class, Evasion, Accuracy, Armor, Magic Resistance and saving throws.
- Whether Magic Resistance applies to all magical damage types or only specified categories.
- Exact damage resolution order for hit/crit, shields, mitigation, resistance, vulnerability, immunity, damage triggers, death saves and on-hit effects.
- Exact death-save system and when a Champion is considered defeated.
- Exact saving throw formula and attributes.
- Exact damage-type mechanics for all 13 types.
- Duration, stacking, refresh, cleansing and diminishing-return rules for effects.
- Boss control resistance and fixed-board semantics for Root, Knockback and movement effects.
- Ultimate animation/activation duration and precise pause/resume behavior.
- Final overtime damage-escalation formula after 30 seconds (prototype schedule PROVISIONAL via P-006).
- Stable tie-breaker for same-initiative Ultimate queue — PROVISIONALLY RESOLVED by P-010.
- How initiative ties are handled when deciding the bottom half that skips the first Basic Attack — PROVISIONALLY RESOLVED by P-008.
- Simultaneous healing versus lethal damage at the same timestamp.

### Champions and economy
- Exact Rank 1–5 copy counts in the shared pool and whether pool counts vary by player count.
- Shop odds by player level/round and whether offers are generated before or after shared-pool updates.
- Initial Gold, baseline income, Rank costs, reroll cost, sell values and experience progression.
- Level-up behavior when buying a duplicate of a level-10 Champion.
- Whether buying a Champion already owned always combines immediately, and exact copy-count accounting after combinations.
- Fielding progression: how many consecutive Rounds are needed per level; how pauses work; whether PvE and PvP both count.
- Feat milestone levels and choice rules.
- Maximum bench size, if any; exact sell/buy/equip UI semantics.
- Whether Gold, Fame, Renown, levels, items and Feats persist across Floors (some persistence is established, but the full table is needed).
- Whether Fame is the player's experience and Renown the player's level. "Play my song" (4 Gold → 4 Fame) suggests so, but shop odds are described as depending on a "player level" that is not otherwise defined.
- How many copies a Champion represents when some of its levels came from fielding rather than combining; this determines what selling returns to the shared pool.
- Whether Gold income is paid after Monster Rounds as well as PvP Rounds.

### Items and Traits
- Names/effects of all nine Components and all 45 completed Items.
- How Components are equipped before automatic combination; temporary component slots and invalid-combination UX.
- Exact item stats, stacking and Champion item eligibility.
- Exact effects and numbers for all 43 Traits and each bracket.
- Rules for hybrid builds, duplicate Trait counts, trait effects on non-matching units and minimum/maximum brackets.
- **Trait bracket arithmetic.** With 120 Champions, Origins average 8 Champions each but the top Origin bracket is 10 (15 × 10 = 150 > 120), and Races average 7.5 against a top bracket of 8 (16 × 8 = 128 > 120). Not every Origin or Race can reach its top bracket unless the roster is uneven or Traits can be granted (e.g. by Items). This conflicts with "every Trait should have a viable vertical build" if "vertical" means the top bracket. Classes are fine (12 × 9 = 108). The Renown cap of 10 also means an Origin-10 team is the whole field.
- Final mapping of all 120 Champions to Race, Class, Origin, Role, abilities and Feats.

### Dungeon and match
- Exact floor count and the round schedule for each Floor after Floor 1.
- Route-choice format, number of options, persistence of route modifiers and convergence details.
- Pairing algorithm implementation and precise treatment of repeated opponents over the last three rounds.
- Exact odd-player PvE opponent scaling formula.
- Exact PvP damage-to-player formula based on surviving enemy Champion health and round/floor.
- Exact Monster Round difficulty and reward bundle generation.
- Exact total reward-value calculation and fairness budget over a match.
- Run streak reset/carry behavior across Floors.
- Exact Run-End Upgrade catalogue, tier thresholds and generation rules.
- Exact Fame-to-Renown thresholds and Renown cap behavior.
- Exact solo Dragon encounter rules after match victory, and what the Dragon fight's outcome changes (if anything).
- What happens when the last remaining players are all eliminated in the same Round (D-006 "last player standing" has no rule for this), and how placements are ordered for simultaneous eliminations.
- Player Health damage after a drawn battle.
- When two players on different routes fight each other, whose route modifiers apply.
- How "last-placed player" is defined for Monster Round difficulty (Health? placement?), including on Floor 1 before any PvP Round.

### Technical/product
- Whether the initial vertical slice should be headless-only before browser UI.
- Board rendering technology (Canvas vs DOM) after prototype evidence.
- Persistence/authentication requirements and whether matches are private rooms or matchmaking.
- Deployment provider, telemetry, accessibility and browser support.

### Schema and content-data issues (found by the 2026-10-11 audit; schemas not yet edited)
All 9 JSON files parse and the 3 schemas are valid JSON Schema Draft 2020-12; all templates and examples validate against their schemas. The following were found and still need fixing in `docs/COMBAT/schemas/`, `docs/COMBAT/templates/` and `docs/COMBAT/examples/`:
- Resolution window name mismatch: `docs/COMBAT/templates/ability-template.json` and `docs/COMBAT/examples/storm_vanguard.json` use `attack_commit`; the effect schema and resolution contract use `action_commit`. The ability schema accepts any string for `resolution_window`.
- Status enums differ: ability/effect `established|proposed|illustrative|deprecated`; champion `proposed|approved|implemented|deprecated`. See the mapping in `DECISIONS.md`.
- The ability schema's `resource` allows `carry_excess: true` and any `reset_to`, contradicting CONFIRMED C-007 (the champion schema enforces it). Resources are defined in both schemas.
- The schemas accept: an Ultimate with no resource target; damage dice `0d0`; any Race or Origin string; duplicate Feat milestone levels; unbounded Accuracy/Evasion; a `combat_time` duration in `charges`; `deal_damage` with no damage type and free-text amount; `stack_intensity` with no cap; `custom_registered_operation` with no name; control effects with no save/immunity data; unknown properties in resource generation rules.
- PROPOSED values are hard-coded as schema limits: `attack_speed ≤ 2` and `initiative_modifier −2…+5` (both PROPOSED in `docs/COMBAT/STAT_MODEL.md`), and six fixed saving-throw attributes (C-020, PROPOSED).
- The effect schema has two `duration` fields (top level and inside `operation`).
- Missing references: effects `apply_stagger_on_hit` and `rogue_resource_on_critical`; the champion template's abilities and Feats. No example set loads end to end.
- `docs/COMBAT/examples/storm_vanguard.json` is a basic-attack ability, not a Champion; consider renaming to `storm_vanguard_basic_attack.json`.
- No schemas yet for statuses, class resources, combat events, Traits, Items, monsters, board or config.

## Safe tunables
These can initially be centralized in configuration and adjusted through tests/simulation: shop odds, pool sizes, costs, reroll price, income and interest caps, experience curve, base HP/damage, crit multipliers, saving-throw DCs, status durations, timers, Trait breakpoints, monster stats, floor count and bot difficulty. Do not hard-code tunables across engine logic.
