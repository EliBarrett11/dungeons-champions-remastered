# Open Questions and Implementation Blockers

This list is intentionally honest about gaps. The presence of a proposal elsewhere does not resolve a question.

## Blockers to the first combat engine

| ID | Question | Why it matters | Status / next action |
|---|---|---|---|
| B1 | Is combat presented as real-time ticks or as initiative-based turns? | Defines the simulation clock and feel. Existing decisions describe simultaneous timed Basic Attacks plus initiative ordering for Ultimate queues; this does not yet specify a full turn system. | UNRESOLVED. Recommend a real-time deterministic simulation with event timestamps, not turn-based rounds, unless user says otherwise. |
| B2 | What is the canonical stat block and exact attack/damage formula? | Required to resolve attacks, defense and scaling. | PARTLY SPECIFIED. Use `docs/COMBAT/RESOLUTION_CONTRACT.md`; several formulas remain proposed. |
| B3 | What is the board geometry and exact field capacity? | Affects placement, targeting and UI. | UNRESOLVED. Fixed fan-shaped formation and no movement are established; 12 spaces/team (back 5, middle 4, front 3) is proposed. |
| B4 | How do duplicate combining, fielding progression, experience, level caps and selling interact? | Affects roster, economy and persistence. | PARTLY SPECIFIED. See `docs/GAMEPLAY/CHAMPIONS.md`. |
| B5 | What are exact Gold/Fame/Renown starting values, incomes, prices and player damage formula? | Required for a complete match loop. | PARTLY SPECIFIED. Confirmed relationships are documented; numeric balance values may remain TUNABLE. |
| B6 | What are the exact Trait effects, stack rules, and interactions? | Required for synergies and final content. | UNRESOLVED at content level. Trait taxonomy and breakpoint targets are known. |
| B7 | What is the full Floor route and 8-player PvP/PvE schedule? | Required for full match progression. | PARTLY SPECIFIED. Floor 1 has three Monster Rounds before the first PvP Round. Later structure needs approval. |
| B8 | What exactly persists when a Run ends, and how are upgrades selected and scaled? | Required for run-end progression. | PARTLY SPECIFIED. Core persistence behavior is known; tier thresholds and upgrade catalogue need definition. |

## Additional rules to settle before their relevant milestones

### Combat
- Exact combat timestamp/tick resolution, event ordering for simultaneous damage, death checks and triggers.
- Exact stat list and canonical derivation of Armor Class, Evasion, Accuracy, Armor, Magic Resistance and saving throws.
- Whether Magic Resistance applies to all magical damage types or only specified categories.
- Exact damage resolution order for hit/crit, shields, mitigation, resistance, vulnerability, immunity, damage triggers, death saves and on-hit effects.
- Exact death-save system and when a Champion is considered defeated.
- Exact saving throw formula and attributes.
- Exact damage-type mechanics for all 13 types.
- Duration, stacking, refresh, cleansing and diminishing-return rules for effects.
- Boss control resistance and fixed-board semantics for Root, Knockback and movement effects.
- Ultimate animation/activation duration and precise pause/resume behavior.
- Exact overtime damage-escalation formula after 30 seconds.
- Stable tie-breaker for same-initiative Ultimate queue.
- How initiative ties are handled when deciding the bottom half that skips the first Basic Attack.

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

### Items and Traits
- Names/effects of all nine Components and all 45 completed Items.
- How Components are equipped before automatic combination; temporary component slots and invalid-combination UX.
- Exact item stats, stacking and Champion item eligibility.
- Exact effects and numbers for all 43 Traits and each bracket.
- Rules for hybrid builds, duplicate Trait counts, trait effects on non-matching units and minimum/maximum brackets.
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
- Exact solo Dragon encounter rules after match victory.

### Technical/product
- Whether the initial vertical slice should be headless-only before browser UI.
- Board rendering technology (Canvas vs DOM) after prototype evidence.
- Persistence/authentication requirements and whether matches are private rooms or matchmaking.
- Deployment provider, telemetry, accessibility and browser support.

## Safe tunables
These can initially be centralized in configuration and adjusted through tests/simulation: shop odds, pool sizes, costs, reroll price, income and interest caps, experience curve, base HP/damage, crit multipliers, saving-throw DCs, status durations, timers, Trait breakpoints, monster stats, floor count and bot difficulty. Do not hard-code tunables across engine logic.
