# Dungeons & Champions — Master Development Package

**Purpose:** authoritative working specification for implementing Dungeons & Champions from scratch with Claude Code.

**Target repository:** `EliBarrett11/dungeons-champions-remastered`  
**Package status:** Draft baseline assembled from established design discussions. Not every game rule is final.

No application code exists yet. This repository currently contains documentation, JSON Schemas, templates and examples only.

## Start here

1. `CLAUDE.md` — concise operating instructions for Claude Code.
2. `docs/PROJECT_BRIEF.md` — product vision and confirmed core constraints.
3. `docs/DECISIONS.md` — status vocabulary, confirmed decisions, provisional prototype rules and explicit proposals.
4. `docs/OPEN_QUESTIONS.md` — blockers and unresolved mechanics.
5. `docs/GLOSSARY.md` — meaning of Match, Round, Floor, Run, Renown and other game terms.
6. `docs/IMPLEMENTATION/ROADMAP.md` — milestone sequence and acceptance gates.
7. `docs/TECHNICAL/ARCHITECTURE.md` — recommended architecture, pending approval.
8. `docs/GAMEPLAY/` — match, economy, roster, traits, items, dungeon and progression rules.
9. `docs/COMBAT/` — combat contract, provisional prototype ruleset, stat proposals, effect catalogue, authoring and validation guidance, and the JSON Schemas (`docs/COMBAT/schemas/`), templates and examples.
10. `docs/CLAUDE_CODE/` — initialization prompt and reusable milestone prompt.
11. `docs/PROGRESS.md` — progress ledger.

`docs/proposals/0001-initial-plan.md` is SUPERSEDED (P-001) and kept for history only.

## Repository layout

```text
CLAUDE.md
README.md
docs/
  PROJECT_BRIEF.md  DECISIONS.md  OPEN_QUESTIONS.md  GLOSSARY.md  PROGRESS.md  PACKAGE_MANIFEST.json
  GAMEPLAY/        MATCH_FLOW, ECONOMY, DUNGEON_AND_REWARDS, CHAMPIONS, TRAITS, ITEMS
  COMBAT/          RESOLUTION_CONTRACT, PROTOTYPE_RULESET_V0, STAT_MODEL, effect catalogue,
                   authoring guide, semantic validation, schema review
    schemas/       ability, champion-combat, effect (JSON Schema Draft 2020-12)
    templates/     blank authoring templates
    examples/      illustrative examples (not roster content)
  TECHNICAL/       ARCHITECTURE
  IMPLEMENTATION/  ROADMAP
  CLAUDE_CODE/     INITIALIZATION_PROMPT, MILESTONE_PROMPT_TEMPLATE
  proposals/       0001-initial-plan (SUPERSEDED)
```

## Status vocabulary

The full definitions, and how older labels (such as "Established" or schema `status` values) map onto them, are in `docs/DECISIONS.md`.

- **CONFIRMED** — explicitly established in design discussions.
- **PROVISIONAL** — explicitly approved for prototype implementation only; values live in config and may change. Not a final game rule.
- **PROPOSED** — a concrete recommendation, not approved.
- **UNRESOLVED** — needs a decision or additional specification.
- **TUNABLE** — can be placed in configuration and adjusted later.
- **DRAFT** — a working formulation that must be reviewed before being treated as authoritative.
- **SUPERSEDED** — replaced by a later decision; history only.

Do not infer approval from the presence of a value in this package. Values explicitly marked PROPOSED, TUNABLE or UNRESOLVED must retain that status until approved.

## Package limits

This package is a structured baseline, not a claim that all 120 Champions, all 43 Traits, all 45 item recipes, or all 240 conceptual effects have been fully authored. It documents the known rules, points to the existing combat schemas and examples, and identifies what remains to be specified.

## Repository correction

The audit identified the actual remote as `github.com/EliBarrett11/dungeons-champions-remastered`. Use that repository. Do not create a second repository to match the earlier shorthand `EliBarrett`.
