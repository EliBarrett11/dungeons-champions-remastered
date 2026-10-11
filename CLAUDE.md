# Dungeons & Champions — Claude Code Instructions

## Goal
Build Dungeons & Champions from scratch as a browser-based, eight-player auto-battler. Follow `docs/PROJECT_BRIEF.md` and the linked specifications.

## Source-of-truth rules
- Read relevant documentation before changing code.
- Treat `CONFIRMED` rules as binding.
- `PROVISIONAL` rules (see `docs/COMBAT/PROTOTYPE_RULESET_V0.md`) may be implemented for the prototype, with their values in config. They are not final game rules; do not extend them beyond their wording.
- Never silently promote `PROPOSED`, `TUNABLE`, `DRAFT` or `UNRESOLVED` material to confirmed or provisional rules.
- Status labels and older-label mappings are defined in `docs/DECISIONS.md`.
- When rules conflict, stop and report the conflict; do not guess.
- Update `docs/DECISIONS.md` when the user approves a meaningful design decision.
- Track unresolved implementation blockers in `docs/OPEN_QUESTIONS.md`.

## Engineering constraints
- Prefer small, complete, testable milestones over broad implementation.
- Keep game rules and combat simulation independent of UI code.
- Combat must be deterministic for a fixed seed and input state.
- Use typed events and explicit, testable resolution order.
- Validate authored content against the canonical JSON Schemas in `docs/COMBAT/schemas/`.
- Never weaken, delete, skip or rewrite a failing test merely to make a check pass. Explain legitimate test changes.
- Do not add dependencies or infrastructure without a clear need.
- Do not implement the full roster or all effects before the first vertical slice is working.

## Safe workflow
- Inspect branch, working tree and recent history before edits.
- Preserve existing work; do not use destructive Git commands.
- Do not commit, push, open PRs, or change repository settings unless explicitly requested.
- Before a milestone, state its scope and acceptance criteria. After it, report changed files, checks run, results, limitations and the next smallest step.

## Project map
- `docs/PROJECT_BRIEF.md` — product intent and core constraints.
- `docs/DECISIONS.md` — status vocabulary, confirmed decisions, provisional prototype rules and proposed defaults.
- `docs/OPEN_QUESTIONS.md` — blockers and unresolved rules.
- `docs/GLOSSARY.md` — game terms (Match, Round, Floor, Run, Renown, …).
- `docs/PROGRESS.md` — progress ledger; update at the end of each milestone.
- `docs/GAMEPLAY/` — match and gameplay systems.
- `docs/COMBAT/` — combat rules, schemas and effect concepts.
  - `docs/COMBAT/RESOLUTION_CONTRACT.md` — combined combat contract.
  - `docs/COMBAT/PROTOTYPE_RULESET_V0.md` — provisional rules for the first prototype.
  - `docs/COMBAT/schemas/`, `docs/COMBAT/templates/`, `docs/COMBAT/examples/` — JSON content contracts and samples.
- `docs/TECHNICAL/ARCHITECTURE.md` — proposed system design.
- `docs/IMPLEMENTATION/ROADMAP.md` — milestone plan.
- `docs/CLAUDE_CODE/` — prompts and workflow.
- `docs/proposals/0001-initial-plan.md` — SUPERSEDED; history only.
- `packages/engine/` — headless deterministic combat engine (M1); `npm run check` runs its type-checks and tests.
- `apps/web/` — browser prototype (M2): `src/game/` pure Expedition rules, `src/ui/` DOM rendering; `npm run dev` / `npm run build`.
- `tools/` — `content_check.py` (T-009) and its tests; `npm run content-check`; `import_roster.py` (`npm run roster:import` / `roster:check`).
- `content/roster/` — approved 135-Champion roster: `champions.json` (generated; do not edit by hand) and the source workbook in `source/`.
