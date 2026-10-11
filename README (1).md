# Dungeons & Champions — Master Development Package

**Purpose:** authoritative working specification for implementing Dungeons & Champions from scratch with Claude Code.

**Target repository:** `EliBarrett11/dungeons-champions-remastered`  
**Package status:** Draft baseline assembled from established design discussions. Not every game rule is final.

## Start here

1. `CLAUDE.md` — concise operating instructions for Claude Code.
2. `docs/PROJECT_BRIEF.md` — product vision and confirmed core constraints.
3. `docs/DECISIONS.md` — confirmed decisions and explicit proposals.
4. `docs/OPEN_QUESTIONS.md` — blockers and unresolved mechanics.
5. `docs/IMPLEMENTATION/ROADMAP.md` — milestone sequence and acceptance gates.
6. `docs/TECHNICAL/ARCHITECTURE.md` — recommended architecture, pending approval.
7. `docs/GAMEPLAY/` — match, economy, roster, traits, items, dungeon and progression rules.
8. `docs/COMBAT/` — combat contract, effect catalogue, authoring and validation guidance.
9. `docs/CLAUDE_CODE/` — initialization prompt and reusable milestone prompt.

## Status vocabulary

- **CONFIRMED** — explicitly established in design discussions.
- **PROPOSED** — a concrete recommendation, not approved.
- **UNRESOLVED** — needs a decision or additional specification.
- **TUNABLE** — can be placed in configuration and adjusted later.
- **DRAFT** — a working formulation that must be reviewed before being treated as authoritative.

Do not infer approval from the presence of a value in this package. Values explicitly marked PROPOSED, TUNABLE or UNRESOLVED must retain that status until approved.

## Package limits

This package is a structured baseline, not a claim that all 120 Champions, all 43 Traits, all 45 item recipes, or all 240 conceptual effects have been fully authored. It documents the known rules, points to the existing combat schemas and examples, and identifies what remains to be specified.

## Repository correction

The audit identified the actual remote as `github.com/EliBarrett11/dungeons-champions-remastered`. Use that repository. Do not create a second repository to match the earlier shorthand `EliBarrett`.
