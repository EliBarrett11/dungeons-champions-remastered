# Dungeons & Champions — Claude Code Instructions

## Goal
Build Dungeons & Champions from scratch as a browser-based, eight-player auto-battler. Follow `docs/PROJECT_BRIEF.md` and the linked specifications.

## Source-of-truth rules
- Read relevant documentation before changing code.
- Treat `CONFIRMED` rules as binding.
- Never silently promote `PROPOSED`, `TUNABLE`, `DRAFT` or `UNRESOLVED` material to confirmed rules.
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
- `docs/DECISIONS.md` — approved decisions and proposed defaults.
- `docs/OPEN_QUESTIONS.md` — blockers and unresolved rules.
- `docs/GAMEPLAY/` — match and gameplay systems.
- `docs/COMBAT/` — combat rules, schemas and effect concepts.
- `docs/TECHNICAL/ARCHITECTURE.md` — proposed system design.
- `docs/IMPLEMENTATION/ROADMAP.md` — milestone plan.
- `docs/CLAUDE_CODE/` — prompts and workflow.
