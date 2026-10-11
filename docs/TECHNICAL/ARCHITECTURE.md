# Technical Architecture Proposal

**Status: PROPOSED.** Use as a reviewable starting point, not as an approved constraint.

## Recommended structure
- TypeScript monorepo.
- Browser client: React + TypeScript + Vite.
- Game engine: pure TypeScript package independent of UI and server framework.
- Content: versioned JSON data validated against canonical JSON Schemas.
- Server: Node.js + TypeScript, authoritative game state, WebSocket transport (`ws`) when multiplayer is introduced.
- Initial multiplayer rooms may be in memory. Defer database and complex infrastructure until persistence requirements are concrete.
- Tests: unit tests for formulas and effects, integration tests for battles/matches, seeded deterministic tests, schema validation, and browser smoke tests after the UI exists.

## Determinism
For a fixed seed and fixed input state, the engine must produce the same state transitions and ordered event log. Randomness must flow through an injected seeded RNG; never use ambient `Math.random()` inside core game logic. Event ordering and tie-breaks must be explicit.

## Suggested monorepo layout
```text
apps/
  web/
  server/              # introduced when multiplayer is scheduled
packages/
  engine/
  content/
  shared/
docs/
  GAMEPLAY/
  COMBAT/
  TECHNICAL/
  IMPLEMENTATION/
```
Do not create every directory in advance if it adds no value to the first milestone.

## Authoritative state
The server will ultimately own match state and validate player actions. Clients submit intents, not trusted state mutations. Combat should be simulated by the engine and represented as ordered typed events so the UI can animate/replay results.

## Content validation
JSON Schema should be the canonical content contract if the project accepts that proposal. Avoid maintaining duplicate hand-written validation schemas. A small validation script and a few well-designed tests are preferable to a heavy tooling stack early.

## Architecture risks
- A complex UI before the engine stabilizes can cause rework.
- Full roster authoring before content schemas stabilize can multiply corrections.
- Networking before deterministic single-process matches work makes debugging harder.
- In-memory rooms are not durable across server restarts; acceptable only for early prototype sessions.
