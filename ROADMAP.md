# Implementation Roadmap

Build in small vertical slices. Every milestone should end with a runnable result, passing checks and a concise report.

## M0 — Specification and repository foundation
**Goal:** make the documentation and project conventions reliable.
- Commit this package.
- Audit schemas and examples.
- Approve/amend architecture proposal.
- Finalize a minimal draft combat contract for the first slice.
- Add `CLAUDE.md`, `OPEN_QUESTIONS.md`, `DECISIONS.md`.
**Acceptance:** docs are present; statuses are explicit; schema/examples validate or failures are documented; no rule is silently invented.

## M1 — Headless deterministic duel
**Goal:** prove the engine can run a complete battle.
- Create minimal TypeScript project and test runner.
- Define only the minimum stat model, board/target model, RNG contract and attack formula needed for two test units.
- Implement a deterministic combat loop and typed event log.
- Use six placeholder Champions only if content is needed for tests; no full roster.
**Acceptance:** same seed/input yields same event-log hash over repeated runs; each fight terminates as win/loss/draw under a cap; unit tests cover dice, hits, damage and defeat; `npm run check` passes.

## M2 — Minimal economy and bot match
**Goal:** demonstrate a complete small match loop without UI.
- Add two players, placeholder shop, buy/sell/reroll and Gold checks.
- Add one simple heuristic bot.
- Add player Health and match-end logic.
**Acceptance:** no overspending; shared-pool counts reconcile; matches terminate with exactly one winner or documented draw; seeded batch tests pass.

## M3 — Browser board and playable local prototype
**Goal:** make the engine visible and interactive.
- Add React/Vite client and simple board.
- Display team, shop, Gold, Health, event log and battle outcome.
- Wire UI actions to engine-facing commands; keep rules out of components.
**Acceptance:** browser smoke test loads; a user can buy/field units and start a battle; no console errors in the smoke path.

## M4 — Core combat systems
Add validated effects, role targeting, resources, Ultimates, damage types, defenses, status effects and death/survival rules in separately testable increments.
**Acceptance:** each mechanic has schema/content validation and focused tests; deterministic event order maintained.

## M5 — Roster, Traits, items and progression
Add Champion data in batches; validate uniqueness and required fields; add Trait breakpoints, Items, Champion levels and Feats.
**Acceptance:** roster count and taxonomy constraints validate; all content passes schema and semantic checks; no unimplemented effect is presented as functional.

## M6 — Dungeon, routes, Monster rounds and rewards
Add Floor/route progression, Monster Round bundles, Run streaks and Run-End Upgrades after the remaining rules are approved.
**Acceptance:** seeded end-to-end match simulation passes route, reward and persistence invariants.

## M7 — Eight-player multiplayer
Add authoritative server, rooms, WebSocket actions, pairing and odd-player PvE replacement.
**Acceptance:** integration tests cover eight players, reconnect/disconnect behavior, invalid actions, simultaneous round resolution and spectator views.

## M8 — Balance, polish and deployment
Run seeded simulations, tune config values, improve animation/accessibility, handle persistence only as required, and deploy.
**Acceptance:** agreed performance, stability, browser support and match-length criteria pass.

## Implementation discipline
Do not skip milestones. If a milestone reveals a rules blocker, stop at the smallest reproducible case, record it, and ask for the decision instead of inventing a rule.
