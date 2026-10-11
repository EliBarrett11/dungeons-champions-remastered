# Progress Ledger

Update this file at the end of each approved milestone.

## Current status
- [x] Existing repository audited by Claude Code.
- [x] Audit established that the full specification package was not in the remote repository.
- [x] Master development package committed to the correct repository (`5398c07`).
- [x] Schema/example validation completed (2026-10-11; results in `OPEN_QUESTIONS.md` → "Schema and content-data issues").
- [x] Documentation reorganised into `docs/` and duplicate documents merged (2026-10-11).
- [x] First-slice combat assumptions approved as PROVISIONAL prototype rules P-001 to P-010 (`DECISIONS.md`, `COMBAT/PROTOTYPE_RULESET_V0.md`).
- [x] Interpretations I-1 to I-9 in `COMBAT/PROTOTYPE_RULESET_V0.md` accepted (2026-10-11).
- [x] Ultimate timing model P-011 ("A + Visual only") recorded; C-009 pause marked SUPERSEDED (2026-10-11).
- [x] Health-below-zero vs. M1 acceptance item 4 resolved by P-012 Health clamping (2026-10-11).
- [x] Ultimate-first same-timestamp resolution P-013 recorded (2026-10-11).
- [x] Basic Attack dice rolled and stored at commitment P-014 recorded (2026-10-11).
- [x] M1 tech stack approved: TypeScript + Vitest headless engine package (T-008, 2026-10-11). Full-game architecture T-001 to T-007 remains PROPOSED.
- [x] M1 readiness decisions recorded: fixture Basic Attack P-015, content-check rules T-009, targeting/defeated attackers P-016 (2026-10-11).
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

### 2026-10-11 — Prototype combat clarifications (documentation only)
- **Scope:** record the accepted interpretations I-1 to I-9 and the Ultimate timing model P-011. No code, schemas, templates, examples or dependencies changed.
- **Changes:** `COMBAT/PROTOTYPE_RULESET_V0.md` (I-1 to I-9 written in as rules, new sections 2.1, 5.1, 9.1, 9.2, 11 and 12; overtime table corrected to ×64 at 55 s); `DECISIONS.md` (P-011, accepted interpretations table, C-009/C-010 notes); `COMBAT/RESOLUTION_CONTRACT.md` (concurrent Ultimate model, old pause text kept and marked SUPERSEDED); `OPEN_QUESTIONS.md`; `GLOSSARY.md`; `IMPLEMENTATION/ROADMAP.md`.
- **Next smallest task:** owner resolves the Health-below-zero wording and approves the M1 tech stack and dependencies; then implement M1.

### 2026-10-11 — Final combat documentation corrections (documentation only)
- **Scope:** record P-012 (Health clamped at 0) and P-013 (Ultimate-first same-timestamp resolution). No code, schemas, templates, examples or dependencies changed.
- **Changes:** `COMBAT/PROTOTYPE_RULESET_V0.md` (sections 3, 7, 9.2, 10, 11 and new 11.1); `COMBAT/RESOLUTION_CONTRACT.md` (sections 4, 6, 10); `DECISIONS.md` (P-012, P-013, notes on C-009 and P-006); `OPEN_QUESTIONS.md` (two questions resolved, two new gaps recorded); `IMPLEMENTATION/ROADMAP.md` (M0 status, M1 scope, acceptance item 4, required tests, M4); `GLOSSARY.md`.
- **Next smallest task:** owner approves the M1 tech stack and dependencies; then implement M1.

### 2026-10-11 — Basic Attack dice at commitment (documentation only)
- **Scope:** record P-014 (Option A). No code, schemas, templates, examples or dependencies changed.
- **Changes:** `COMBAT/PROTOTYPE_RULESET_V0.md` (section 9.2 rewritten as the full random-number order; new section 9.3 on the stored attack outcome; sections 7, 10, 11.1 and 12 aligned); `COMBAT/RESOLUTION_CONTRACT.md` (section 4: P-013 steps, P-014 summary, old algorithm's roll step marked superseded); `DECISIONS.md` (P-014 and notes on earlier entries); `OPEN_QUESTIONS.md` (random-number timing resolved; opening-Ultimate draw placement added); `IMPLEMENTATION/ROADMAP.md` (M1 scope and tests; M4 Ultimate tests); `GLOSSARY.md` (Commitment).
- **Next smallest task:** owner approves the M1 tech stack and dependencies; then implement M1.

### 2026-10-11 — M1 readiness decisions (documentation only)
- **Scope:** record the four decisions approved after the M1 implementation-readiness audit. No code, schemas, templates, examples or dependencies changed.
- **Changes:** `DECISIONS.md` (T-008, T-009, P-015, P-016; P-007 note); `COMBAT/PROTOTYPE_RULESET_V0.md` (sections 3, 7, 8, 9.2, 11.1, 12 and header); `COMBAT/RESOLUTION_CONTRACT.md` (section 4); `IMPLEMENTATION/ROADMAP.md` (M0 status, M1 scope, acceptance item 7, required tests); `OPEN_QUESTIONS.md` (headless-first question resolved for M1; content-check note).
- **Next smallest task:** implement M1, starting with the package scaffold and `npm run check`, when the owner asks.

## Required end-of-task report
- Milestone and scope
- Files changed
- Commands/checks run and exact results
- Acceptance criteria passed/failed
- New decisions or unresolved blockers
- Next smallest recommended task
