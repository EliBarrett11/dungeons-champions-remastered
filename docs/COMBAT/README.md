# Dungeons & Champions — Combat Effects and Ability Authoring Package

Version: 0.1-draft  
Status: Implementation specification draft  
Audience: Claude Code / game implementation team

## Purpose

This package defines a consistent, data-driven way to author Champion abilities and battle effects for Dungeons & Champions. The combat engine should implement reusable primitives; individual Champions should be data, not bespoke code wherever possible.

## Package contents

- `schemas/effect.schema.json` — JSON Schema for individual effect definitions.
- `schemas/ability.schema.json` — JSON Schema for Basic Attacks, Passives, Ultimates, and Feats.
- `schemas/champion-combat.schema.json` — JSON Schema for a Champion's combat-facing definition.
- `templates/effect-template.json` — blank effect authoring template.
- `templates/ability-template.json` — blank ability authoring template.
- `templates/champion-combat-template.json` — blank Champion combat template.
- `examples/` — illustrative example definitions. These are examples, not finalized roster content.
- `RESOLUTION_CONTRACT.md` (combined combat contract), `PROTOTYPE_RULESET_V0.md` (provisional prototype rules), `effect-catalogue.md`, `ability-authoring-guide.md`, `semantic-validation.md` and `SCHEMA_REVIEW.md` — in this folder.

This folder was originally a separate starter package; its README was previously at the repository root. Its earlier `resolution-contract.md` has been merged into `RESOLUTION_CONTRACT.md`.

## Authority and uncertainty

The project-wide status vocabulary, and how the labels below map onto it, is defined in `docs/DECISIONS.md`. "Established" items count as CONFIRMED only where `docs/DECISIONS.md` lists them as CONFIRMED.

The package distinguishes:
- **Established**: decisions directly established in design conversations.
- **Proposed**: implementation recommendations or provisional values that still require testing or explicit approval.
- **Illustrative**: examples only.

Do not silently convert Proposed or Illustrative content into immutable game rules.

## Core design principles

1. Use a shared combat engine and data-driven definitions.
2. Every attack/effect must have explicit timing, target rules, damage types, stacking behavior, duration, and removal behavior where relevant.
3. Combat must be reproducible from a recorded seed and stable event ordering.
4. Simultaneous basic attacks resolve from the same pre-resolution combat state.
5. Ultimates that become ready at the same time enter an initiative-ordered priority queue.
6. A Champion's Class Resource resets to zero immediately when its Ultimate triggers; no excess resource carries over.
7. The initiative-granted opening Ultimate is separate from normal resource-triggered activation.
8. Effects must not create unbounded trigger loops.
9. Rendering frames and browser performance must not alter combat outcomes.
10. Unknown, unsupported, or ambiguous effect operations must fail validation rather than be guessed.

## Important implementation note

The schemas describe data shape and some cross-field constraints. JSON Schema alone cannot validate all game semantics. Implement a second semantic validation layer for references, timing compatibility, resource rules, trigger cycles, effect stacking, target availability, and balance warnings.
