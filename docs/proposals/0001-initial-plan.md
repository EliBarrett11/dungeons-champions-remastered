# Proposal 0001 — Initial Architecture & Roadmap

Status: **PROPOSED** (awaiting owner approval). Nothing here is an approved rule yet.
Date: 2026-10-11

## 1. Repository status at time of writing

- Remote: `github.com/EliBarrett11/dungeons-champions-remastered` (note: `EliBarrett11`, not `EliBarrett`).
- Branches: `main`, `claude/dungeons-champions-init-2378un` (identical, 1 commit "Initial commit").
- Contents: `README.md` (title only). No code, docs, assets, tests, CI, or license.
- Tooling available in the dev container: Node 22.22, npm 10.9, pnpm 10.28, bun, tsc, git 2.43, docker, Chromium/Playwright.

## 2. Recommended architecture

Single TypeScript monorepo using **npm workspaces** (no extra tool to install).

```
packages/engine/   Pure TS. No DOM, no Node APIs, no I/O, no clocks.
                   Seeded RNG, dice, combat simulation, match state machine,
                   economy, dungeon progression, bot AI.
packages/content/  Data definitions (Champions, Traits, Roles, Classes, Items,
                   Feats, Monsters, Floors) as typed TS/JSON + zod schemas +
                   content validation tests.
apps/client/       Vite + React (UI/menus/shop) + Canvas 2D board renderer.
apps/server/       Node + `ws`. Hosts engine match instances authoritatively.
docs/              Source of truth for rules and decisions.
```

### Key decisions and trade-offs

1. **Engine as a pure reducer.** `step(state, action) -> state` and
   `simulateCombat(boardA, boardB, seed) -> CombatLog`. Server, client
   single-player, bots, and tests all run the same code. Most bugs become unit
   tests, not network debugging.
2. **Determinism rules.** Seeded PRNG implemented in-repo (e.g. sfc32/mulberry32);
   integer math only for gameplay values (percentages as integers / basis
   points); no `Math.random`, `Date`, or object-key-order dependence; stable
   tie-breakers (unit id). Enforced with golden-replay tests (same seed → same
   log hash).
3. **Turn-based initiative combat, not real-time ticks** (recommended; needs
   approval). Fits D&D initiative/attack rolls naturally, is simpler to make
   deterministic, and is easy to animate from an event log.
4. **Server sends an event log, client only renders.** The client never
   re-simulates authoritative results, so no client/server drift is possible.
   Trade-off: slightly larger messages (negligible).
5. **Single-player vs 7 bots before networking.** The full game loop runs in the
   browser with zero infrastructure. Multiplayer then becomes "move the reducer
   to the server and add rooms."
6. **Plain `ws` instead of Colyseus or similar.** Fewer abstractions to learn and
   maintain. Rooms and reconnects are cheap to build because state is a single
   serialisable object. Revisit only if the plain approach proves painful.
7. **zod** for content schemas and network-message validation. It's the only
   runtime dependency besides React and ws.
8. **Tooling:** Vitest (unit/golden tests), Biome (lint+format in one dependency),
   `tsc --noEmit` strict, GitHub Actions CI. Playwright smoke test added at the
   client milestone.
9. **No database initially.** Matches are in-memory. Meta-progression
   (Renown / Run-End Upgrades, if persistent) starts in localStorage. Add SQLite
   only when accounts are actually required.
10. **IP hygiene.** Use SRD 5.1 (CC-BY-4.0) style mechanics only. Avoid the
    "Dungeons & Dragons" trademark and non-SRD product identity (e.g. beholder,
    mind flayer). Keep attribution in `docs/LICENSES.md` if SRD text is used.

### Recurring costs

- Development: Claude usage. GitHub and GitHub Actions are free within the
  free-tier minutes.
- Hosting (from M8): static client on GitHub Pages or Cloudflare Pages (free),
  plus one small Node host for WebSockets (Fly.io, Render, or Railway; roughly
  $0–7/month at friends-scale). An optional domain is about $12/year.
- No paid SDKs or services are required.

## 3. Milestone roadmap (dependency-ordered)

| # | Milestone | Acceptance criteria |
|---|-----------|---------------------|
| M0 | Scaffold + docs | Workspaces build; `npm run check` (tsc, biome, vitest) passes locally and in CI; CLAUDE.md + docs skeleton committed. |
| M1 | Deterministic core | PRNG, dice notation, d20 attack vs AC, crit on nat 20 (configurable), damage types with resist/vuln/immune, saving throws; 100% unit-tested; same seed reproduces identical sequences. |
| M2 | Combat sim v1 | Board model, initiative order, movement/targeting, basic attacks, death, win/draw, round cap; typed event log; golden-replay tests; ~6 sample champions validated by schema. |
| M3 | Combat sim v2 | Resources → Ultimates, status effects with stacking rules, trait/role/class synergy hooks; ~12 champions, ~6 traits; balance-sim CLI (N seeded fights → win rates). |
| M4 | Headless match loop | Shared pool, Tavern shop/reroll/lock, Gold income, champion levels, bench, PvP pairing, player HP, elimination; heuristic bots; 8-bot match runs to completion headlessly and deterministically. |
| M5 | Browser single-player | Vite client: shop, bench, drag-place on board, combat playback from log, round results; playable full match vs 7 bots; Playwright smoke test. |
| M6 | Dungeon journey | Floors, route choices, Monster Rounds, Items/Feats rewards, Dragon finale, Run-End Upgrades; end-to-end run test. |
| M7 | Multiplayer server | Lobby codes, 8 seats with bot fill, phase timers, authoritative actions validated server-side, reconnect, spectating eliminated players; integration tests with simulated clients. |
| M8 | Deploy + friends playtest | Public URL, one-command deploy, basic logs; a full match playable with friends. |
| M9+ | Content expansion | Batches of ~15–20 champions with traits; every batch passes schema validation + balance-sim thresholds; reaches 120/43/9/12. |

Fame/Renown are placed at M4/M6 depending on what they are (see blockers).

## 4. Proposed documentation structure

```
CLAUDE.md                 ≤60 lines: purpose, commands, layout, invariants
                          (determinism rules, no-test-weakening), working
                          method, pointers to docs below.
docs/PROGRESS.md          Short ledger: done / in progress / next 3 tasks.
docs/DECISIONS.md         Append-only ADR log (date, decision, why, alternatives).
docs/ARCHITECTURE.md      Package boundaries, data flow, determinism contract.
docs/ROADMAP.md           Milestones + acceptance criteria (from §3).
docs/OPEN_QUESTIONS.md    Design blockers and tunables, each with status.
docs/rules/*.md           combat.md, economy.md, dungeon.md, content-model.md,
                          status-effects.md; each section marked Draft/Approved.
```

Numeric tunables live in `packages/content/src/config/*.ts`, not in prose docs.

## 5. Unresolved design decisions

### Genuine blockers (need an answer before the milestone named)

1. **(M2) Board:** hex or square grid; dimensions; how many units can be fielded.
2. **(M2) Combat model:** initiative turns (recommended) or real-time; what a turn
   contains (move + action?); targeting rules; round cap / draw resolution.
3. **(M2) Stat block:** which stats exist (AC, HP, ability scores? proficiency?
   speed, range); how attack bonus and damage are derived.
4. **(M3) Resources & Ultimates:** mana-like meter, spell slots, or charges; how
   they are gained.
5. **(M3) Role vs Class vs Trait:** how many of each per champion; which ones grant
   synergy breakpoints; whether Roles drive AI behaviour or positioning.
6. **(M4) Champion levels:** gained by duplicates (TFT-style combining), XP, or
   both; max level; what a level changes.
7. **(M4) Currencies:** exact meaning of Gold, Fame, and Renown, i.e. which are
   in-run and which are meta, and what each buys (player level/shop odds? upgrades?).
8. **(M4) Player HP & damage:** how losing a PvP round damages a player; elimination.
9. **(M6) Run structure with 8 players:** do all players share one Floor schedule
   and choose routes individually? How are PvP pairings made if players are on
   different routes? Ratio of Monster Rounds to PvP.
10. **(M6) Feats vs Items:** source, slots, combining, and whether they persist.
11. **(M6) Dragon & win condition:** is the Dragon a shared final boss or a
    per-player fight? Is the winner the last player standing, the first to beat
    the Dragon, or a score?
12. **(M6) Run-End Upgrades:** persistent across matches (needs storage/accounts)
    or within a run only?

### Tunable later (use placeholder values in config)

Shop odds, pool sizes, costs, reroll price, income/interest/streaks, XP curve,
HP/damage numbers, crit multiplier, save DCs, status durations, timer lengths,
synergy breakpoint values, monster stats, floor count, bot difficulty.

## 6. Single best next action

Owner answers blockers 1–3 (board, combat turn model, stat block), or supplies
any existing design documents. In parallel, approve this proposal so M0
(scaffold + CLAUDE.md + docs skeleton + CI) can begin. M0 has no design
dependencies.
