# Progress Ledger

Update this file at the end of each approved milestone.

## Current status
- [x] Existing repository audited by Claude Code.
- [x] Audit established that the full specification package was not in the remote repository.
- [x] Master development package committed to the correct repository (`5398c07`).
- [x] Schema/example validation completed (2026-10-11; results in `OPEN_QUESTIONS.md` → "Schema and content-data issues").
- [x] Documentation reorganised into `docs/` and duplicate documents merged (2026-10-11).
- [x] First-slice combat assumptions approved as PROVISIONAL prototype rules P-001 to P-010 (`DECISIONS.md`, `COMBAT/PROTOTYPE_RULESET_V0.md`).
- [ ] Interpretations I-1 to I-9 in `COMBAT/PROTOTYPE_RULESET_V0.md` confirmed.
- [ ] Architecture / tech stack (T-001, T-002) and minimal dev dependencies approved.
- [ ] Schema fixes from the audit applied.
- [ ] M1 headless deterministic duel implemented and tested.

## Session log

### 2026-10-11 — Documentation audit and repair (M0)
- **Scope:** audit only, then documentation repair only. No application code, no schema content changes, no dependencies.
- **Checks run (Python `jsonschema` 4.26.0, already installed):** all 9 JSON files parse; all 3 schemas are valid Draft 2020-12; all 3 templates and both examples validate against their schemas; 3/3 `$ref` targets resolve; 11 cross-file IDs are missing (placeholder references); 13 negative probes were all accepted by the schemas (listed in `OPEN_QUESTIONS.md`).
- **Changes:**
  - Moved every file from the repository root into the layout in `README.md` (contents unchanged for all JSON files).
  - Root `README.md` is now the master README; the combat-package README moved to `docs/COMBAT/README.md`.
  - Merged `resolution-contract.md` into `docs/COMBAT/RESOLUTION_CONTRACT.md` without promoting any rule.
  - Added the status vocabulary and older-label mapping, provisional rules P-001 to P-010, and notes on affected earlier entries to `DECISIONS.md`.
  - Added `docs/COMBAT/PROTOTYPE_RULESET_V0.md` and `docs/GLOSSARY.md`.
  - Marked `docs/proposals/0001-initial-plan.md` SUPERSEDED.
  - Updated `OPEN_QUESTIONS.md`, `IMPLEMENTATION/ROADMAP.md` (M0 status, M1 scope), `CLAUDE.md` project map and `PACKAGE_MANIFEST.json`.
- **Next smallest task:** owner confirms I-1 to I-9 and approves the M1 tech stack and dependencies; then implement M1.

## Required end-of-task report
- Milestone and scope
- Files changed
- Commands/checks run and exact results
- Acceptance criteria passed/failed
- New decisions or unresolved blockers
- Next smallest recommended task
