# Decisions Register

This register distinguishes established design intent from proposals. Approval means explicit user approval, not merely inclusion in a draft.

## Status vocabulary
These are the only status labels for rules in this project.

| Label | Meaning |
|---|---|
| CONFIRMED | Explicitly established by the owner as a game rule. Binding. |
| PROVISIONAL | Explicitly approved by the owner for prototype implementation only. May be implemented; values live in config; may change after simulation/playtesting. Not a final game rule. |
| PROPOSED | A concrete recommendation, not approved. Must not be implemented as a rule. |
| TUNABLE | A value that can be placed in configuration and adjusted later. |
| DRAFT | A working formulation that must be reviewed before being treated as authoritative. |
| UNRESOLVED | Needs a decision or additional specification. |
| SUPERSEDED | Replaced by a later decision; kept for history only. |

**Mapping of older labels.** Earlier files used other words. Read them as follows; this mapping never upgrades a status.

| Found in | Older label | Read as |
|---|---|---|
| Combat starter package prose | Established | CONFIRMED only if it also appears as CONFIRMED in this register; otherwise PROPOSED |
| Combat starter package prose | Proposed | PROPOSED |
| Combat starter package prose / schemas | Illustrative / `illustrative` | Example only; not a rule and not roster content |
| `ability` / `effect` schema `status` | `established` | Same as "Established" above |
| `ability` / `effect` / `champion` schema `status` | `proposed` | PROPOSED |
| `champion` schema / authoring guide | `approved` | Content explicitly approved by the owner |
| `champion` schema / authoring guide | `implemented` | Approved content that the engine supports and tests cover |
| any schema | `deprecated` | SUPERSEDED |
| This register | "APPROVED DEVELOPMENT APPROACH", "CONFIRMED design target" | CONFIRMED as stated, with the qualifiers in the row |

Aligning the schema `status` enums themselves is tracked in `OPEN_QUESTIONS.md` (schema issues); the schemas were not edited.

## Confirmed design decisions

| ID | Decision | Status |
|---|---|---|
| D-001 | The game is an eight-player browser-based auto-battler with automated battles. | CONFIRMED |
| D-002 | Each Champion has exactly one Race, one Class and one Origin Trait; each has one Role. | CONFIRMED |
| D-003 | Planned roster size is 120 Champions and 43 Traits: 16 Races, 12 Classes, 15 Origins. | CONFIRMED |
| D-004 | Champions have Basic Attack, Passive, Ultimate and two Feat milestones with choices. | CONFIRMED |
| D-005 | Champion levels span 1–10; duplicate combining and consecutive-round fielding progression are intended. | CONFIRMED; detailed rules unresolved |
| D-006 | Players start at 100 Health; elimination occurs at 0 Health; last player standing wins. | CONFIRMED |
| D-007 | The match winner then fights a solo Dragon. | CONFIRMED |
| D-008 | Players can spectate/select any player at any time, including after elimination. | CONFIRMED |
| D-009 | Gameplay information is public; Tavern interactions are private, but offers are visible to all and do not reserve shared-pool copies. | CONFIRMED |
| D-010 | Every pair of nine Item Components yields a unique completed Item: 45 recipes total, including identical pairs. | CONFIRMED |
| D-011 | A Champion can hold at most three completed Items; completed Items cannot be unequipped while that Champion is owned. | CONFIRMED |
| D-012 | Selling a Champion returns completed Items to the owner's inventory; elimination destroys that player's items/components rather than transferring them. | CONFIRMED |
| D-013 | Trait bracket design targets Origins 2/4/6/8/10, Races 2/4/6/8, Classes 3/5/7/9. | CONFIRMED design target; individual trait effects unresolved |
| D-014 | Every damage type should have a meaningful mechanical identity; a damage type does not apply a status automatically unless the ability says so. | CONFIRMED |
| D-015 | Combat uses a shared effect catalogue and machine-readable effect/ability/Champion schemas. | CONFIRMED direction; schema review required |
| D-016 | The game should be built incrementally, with a deterministic engine and tests before full content and multiplayer. | APPROVED DEVELOPMENT APPROACH |

## Combat decisions established in design discussions

| ID | Decision | Status |
|---|---|---|
| C-001 | Every Champion rolls d20 + Initiative Modifier at battle start. Highest initiative roll(s) receive an opening Ultimate bonus. | CONFIRMED |
| C-002 | Initiative ties for opening Ultimate grant the bonus to every Champion tied for highest. | CONFIRMED |
| C-003 | The bottom half of Champions by initiative roll skip their first Basic Attack. | CONFIRMED; median-boundary tie handling PROVISIONAL via P-008 |
| C-004 | Basic Attack timers are independent of initiative. | CONFIRMED |
| C-005 | Basic attacks due at the same combat timestamp resolve simultaneously. | CONFIRMED |
| C-006 | Class Resources are generated by class-specific events; e.g. Barbarian gains Rage when it takes damage. | CONFIRMED principle |
| C-007 | When a Champion's resource reaches its target, its Ultimate triggers immediately and resource resets to zero with no excess carry-over. | CONFIRMED |
| C-008 | Opening bonus Ultimate is separate from the resource-triggered Ultimate. | CONFIRMED |
| C-009 | Ultimates take priority over Basic Attacks; Basic Attack timers pause during Ultimate activation/resolution and resume with progress preserved. | **Pause behaviour SUPERSEDED by P-011** (owner decision, 2026-10-11): Ultimates never pause Basic Attack timers. The "priority over Basic Attacks" wording is now given a PROVISIONAL meaning by P-013: ready Ultimates resolve before committed Basic Attacks at the same timestamp, without pausing anything. |
| C-010 | Simultaneously ready Ultimates queue by initiative descending; caster and target validity are rechecked before each resolution. | CONFIRMED. Under P-011 the "queue" is a deterministic resolution order at the trigger timestamp; it never delays or pauses Basic Attacks. |
| C-011 | Equal-initiative Ultimate tie-break must be deterministic; Champion instance ID then board slot was proposed. | Determinism requirement CONFIRMED; the proposed ordering is SUPERSEDED by P-010 |
| C-012 | Standard Champions: natural 1 always misses; natural 20 always hits and critically hits. | CONFIRMED |
| C-013 | Rogue critical range is natural 16–20; proposed multiplier is 1.5x; qualifying crits generate class resource. | Range/resource confirmed; multiplier PROPOSED |
| C-014 | Sorcerer natural 1–2 always miss; natural 19–20 are critical only if the attack otherwise hits; natural 20 always hits and critically hits. | CONFIRMED |
| C-015 | Sorcerer gains Wild Magic resource from qualifying criticals and misses. | CONFIRMED |
| C-016 | Rogue resource is gained once per qualifying critical attack, not per damage instance. | CONFIRMED |
| C-017 | Sorcerer resource comes from its own attack criticals/misses. | CONFIRMED |
| C-018 | If combat exceeds 30 seconds, damage dealt by all units increases exponentially until a winner emerges. | CONFIRMED intent; final formula unresolved; prototype schedule and hard cap PROVISIONAL via P-006 |
| C-019 | The proposed physical mitigation formula is `damage * 100 / (100 + max(0, Armor))`. | PROPOSED as a final rule; PROVISIONAL for the prototype via P-005 |
| C-020 | Six saving-throw attributes proposed: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma. | PROPOSED |
| C-021 | Control should have duration caps, boss resistance and diminishing returns; fixed-board Root/Knockback need adapted semantics. | CONFIRMED design requirements; values unresolved |

## Provisional prototype rules

Approved by the owner on 2026-10-11 as **provisional prototype rules** (audit decisions D-1 to D-10, then P-011, the accepted interpretations I-1 to I-9, P-012 to P-014, and the M1 readiness decisions P-015 and P-016). Full wording is in `COMBAT/PROTOTYPE_RULESET_V0.md`. None of these is a CONFIRMED final game rule.

| ID | Audit ref | Decision | Status |
|---|---|---|---|
| P-001 | D-1 | The master development package is authoritative; `proposals/0001-initial-plan.md` is SUPERSEDED. | PROVISIONAL |
| P-002 | D-2 | Combat is a timed, event-scheduled simulation on an integer-millisecond timeline; no frame rate, not turn-based. | PROVISIONAL |
| P-003 | D-3 | Prototype board: fixed fan formation of 12 slots per side (front 3, middle 4, back 5), no movement. Basic Attacks target the frontmost occupied enemy row, lowest slot index, and keep that target until it is defeated. No ranges; no role-priority targeting yet. | PROVISIONAL |
| P-004 | D-4 | Hit roll: `d20 + Accuracy ≥ 10 + Evasion`; natural 1 misses, natural 20 hits and crits (C-012). | PROVISIONAL |
| P-005 | D-5 | Damage per component: dice roll + (scaling stat × ratio); critical ×2 on the whole pre-mitigation amount; physical Armor mitigation `×100/(100+max(0,Armor))`; round down once at the end of each component; minimum 1 damage on a hit. | PROVISIONAL |
| P-006 | D-6 | Defeat at Health ≤ 0, no death saves; attacks committed at the same timestamp all resolve; both teams wiped at the same timestamp is a draw; overtime ×2 after 30 s, doubling every 5 s; hard stop at 60 s counts as a draw. | PROVISIONAL; defeat wording refined by P-012 (Health clamped at 0) |
| P-007 | D-7 | M1 test units use the `COMBAT/STAT_MODEL.md` Role table at Rank 1, level 1 as test fixtures, not balance. | PROVISIONAL; fixture Basic Attack and custom stat blocks for focused unit tests added by P-015 |
| P-008 | D-8 | Initiative ranks by total (d20 + modifier) across all Champions in the battle; bottom half = lowest floor(N/2); ties at the boundary do not skip; a skipped first attack means the first timer cycle completes with no attack. | PROVISIONAL |
| P-009 | D-9 | One small in-repo seeded PRNG (sfc32 recommended) per battle; battle seed derived from match seed, round and pairing; documented consumption order; no `Math.random`. | PROVISIONAL |
| P-010 | D-10 | Same-timestamp ordering: initiative total descending, then team side, then board slot index. Replaces the C-011 proposal. | PROVISIONAL |
| P-011 | Owner choice "A + Visual only" | Ultimate timing: Basic Attack timers keep progressing while Ultimates activate and resolve; an Ultimate resolves immediately at the timestamp its resource reaches its target unless the ability defines a cast time; no Ultimate pauses any Champion's Basic Attack timer; animations are presentation only and never affect simulation time; future explicit cast times must not pause the battle (no cast/interrupt system is defined yet); simultaneous actions resolve deterministically. Supersedes the pause in C-009; C-001, C-002, C-007, C-008 and C-010 unchanged. | PROVISIONAL |
| P-012 | Owner decision A | Health clamping: authoritative Health never falls below 0; damage that would take it lower sets it to 0; excess damage may be logged separately from Health but never produces negative Health; a Champion at 0 Health is defeated; clamping applies to all damage and never cancels another attack already committed at the same timestamp. Refines the P-006 defeat wording "Health ≤ 0". | PROVISIONAL |
| P-013 | Owner decision B | Ultimate-first same-timestamp resolution: identify eligible actions; commit all eligible Basic Attacks (fixing target and inputs); resolve ready Ultimates in the C-010/P-010 order with C-010 validity rechecks; then resolve committed Basic Attacks in P-010 order. Committed attacks keep their targets and are not cancelled by defeat of target or attacker after commitment; P-012 clamping applies throughout; nothing pauses the clock or any Basic Attack timer. Gives C-009's "priority over Basic Attacks" wording a provisional meaning; supersedes the ordering in the PROPOSED simultaneous-timestamp algorithm (`COMBAT/RESOLUTION_CONTRACT.md` section 4), which placed newly ready Ultimates after Basic Attack damage. | PROVISIONAL |
| P-014 | Owner decision (Option A) | Basic Attack dice rolled at commitment: when a Basic Attack is committed, its target is stored, its d20 and all applicable damage dice (on a hit, per I-6) are rolled, and on a hit the complete damage is calculated from the inputs fixed at commitment; the outcome is stored. Health is not changed until the attack resolves. The stored outcome is resolved only after ready Ultimates have resolved (P-013). No intervening Ultimate resolution or random draw can re-roll, alter or replace it. Basic Attack resolution draws no random numbers. Rules for defeated attackers and targets (P-006, P-013), clamping (P-012), ordering (P-010), seeded randomness (P-009) and the hard stop (I-4) are unchanged. Full random-number order: `COMBAT/PROTOTYPE_RULESET_V0.md` section 9.2. | PROVISIONAL |
| P-015 | M1 readiness decision D2 | Shared placeholder Basic Attack for M1 test fixtures: dice expression `1d8` (flat bonus 0), scaling stat Attack, scaling ratio 1.0 (10,000 basis points), physical damage. Base damage amount (P-005 step 1): `1d8 + Attack × 1.0`; P-005 then applies, in order, critical hit ×2, Armor mitigation, overtime multiplier, one round-down and the minimum of 1 damage on a hit. Battle-level tests use Role-table stats (P-007); focused unit tests may use custom stat blocks so edge cases have exact expected results. Test-fixture data only; not the Basic Attack of any real Champion. | PROVISIONAL (test fixtures only) |
| P-016 | M1 readiness decision D4 | Targeting and defeated attackers: for targeting, an occupied slot is one occupied by a non-defeated Champion; a defeated Champion cannot commit new Basic Attacks at later moments; a Basic Attack already committed before its attacker or target is defeated still resolves with its stored outcome and original target (P-006, P-012, P-013, P-014 unchanged). | PROVISIONAL |

### Accepted interpretations
The owner accepted all nine on 2026-10-11, including the safeguards and clarifications discussed. Each is PROVISIONAL with the same standing as the P- rules. Full wording: `COMBAT/PROTOTYPE_RULESET_V0.md` (section given).

| ID | Accepted interpretation | Ruleset section | Status |
|---|---|---|---|
| I-1 | Slots numbered left to right within each row: front 0–2, middle 3–6, back 7–11. | 3 | PROVISIONAL |
| I-2 | Interval `round(1000 / attacks_per_second)` ms (halves up), attack speed > 0, interval ≥ 1 ms; first attack after one full interval; a skipping Champion's first actual attack after two intervals. | 2.1 | PROVISIONAL |
| I-3 | Overtime ×1 before 30,000 ms, ×2 at 30,000 ms, doubling every 5,000 ms (×64 at 55,000 ms). | 7 | PROVISIONAL |
| I-4 | At 60,000 ms the battle stops before any action at that timestamp resolves; later actions never resolve. | 7 | PROVISIONAL |
| I-5 | Sides assigned from the battle seed: first 32-bit generator output even → participant 0 is side A, odd → participant 1 is side A; fixed for the battle. | 9.1 | PROVISIONAL |
| I-6 | Consumption order: side assignment, then initiative (side A then B, slot ascending), then per committed attack in P-010 order the d20 and, on a hit, each component's dice in order. Critical hits multiply the whole pre-mitigation amount by ×2; no extra dice in M1. | 5, 9.2 | PROVISIONAL |
| I-7 | Missing Initiative Modifier defaults to +0, for prototype test fixtures only. | 6, 8 | PROVISIONAL |
| I-8 | New target selected at commit if the old one was defeated at an earlier timestamp (frontmost row, lowest slot); a committed attack keeps its target even if that target falls at the same timestamp; no attack if no enemy is alive. | 3 | PROVISIONAL |
| I-9 | Integer arithmetic: attack speed in thousandths, scaling ratios in basis points, each damage component carried as an exact fraction and floored once at the end; no uncontrolled floating point in authoritative state. | 5.1 | PROVISIONAL |

Effects on earlier entries: C-003 boundary ties → P-008; C-009 pause → superseded by P-011, C-009 "priority" → given provisional meaning by P-013; P-006 defeat wording → refined by P-012; PROPOSED simultaneous-timestamp algorithm ordering → superseded by P-013, and its "resolve rolls" step for Basic Attacks → superseded by P-014; I-6 consumption order → extended by P-014 to place Basic Attack draws at commitment; C-011 ordering → P-010; C-018 prototype schedule → P-006 and I-3/I-4; C-019 → P-005 (prototype only); T-006 board shape → superseded by P-003; `OPEN_QUESTIONS.md` B1 → P-002, B3 → P-003 (prototype).

## Proposed technical decisions awaiting approval

| ID | Decision | Status |
|---|---|---|
| T-001 | TypeScript monorepo with React + TypeScript + Vite browser client. | PROPOSED |
| T-002 | Pure TypeScript deterministic combat engine, independent from UI. | PROPOSED architecture, strongly recommended |
| T-003 | Node.js/TypeScript authoritative server with WebSockets (`ws`) and in-memory rooms for initial multiplayer. | PROPOSED |
| T-004 | JSON Schema is canonical for content validation; do not maintain parallel schemas without a strong reason. | PROPOSED |
| T-005 | Start with a headless deterministic duel and a bot, then add browser UI, then networking. | PROPOSED implementation order |
| T-006 | First prototype board uses a 3×4 board per side and six placeholder Champions. | Board shape SUPERSEDED by P-003; placeholder count still PROPOSED |
| T-007 | The project should defer database and complex infrastructure until persistence is demonstrably needed. | PROPOSED |

## Approved technical decisions for M1
Approved by the owner on 2026-10-11 (M1 readiness decisions D1 and D3). They apply to M1 only and do **not** approve the full-game architecture: T-001 to T-007 above remain PROPOSED except where these rows say otherwise.

| ID | Audit ref | Decision | Status |
|---|---|---|---|
| T-008 | M1 readiness decision D1 | M1 stack: TypeScript for a headless combat-engine package and Vitest for automated tests. `npm run check` must run type-checking and the tests. No React, Vite, server, browser UI or multiplayer in M1. No other dependency may be added without a concrete, identified need and the approval repository policy requires. This approves only the engine-package part of T-001/T-002 for M1. | PROVISIONAL (M1 only) |
| T-009 | M1 readiness decision D3 | M1 content check (roadmap M1 acceptance item 7). **Fail** on: invalid JSON; a schema that is invalid or cannot be compiled; any template or example that fails validation against its applicable schema. **Warn, but do not fail**, on: the known missing placeholder references and the known `attack_commit` resolution-window mismatch. Use the existing Python `jsonschema` tooling if suitable; no new validator dependency without concrete justification and approval. Schema-validation failures and known content-data warnings are reported separately. Details: `IMPLEMENTATION/ROADMAP.md` M1. | PROVISIONAL (M1 only) |

## Repository decision
The repository audit reports the actual remote as `github.com/EliBarrett11/dungeons-champions-remastered`. Use that remote. The earlier shorthand `EliBarrett/dungeons-champions-remastered` was inaccurate.

## Documentation decisions
- 2026-10-11: Documentation reorganised into the `docs/` layout described in the root `README.md`. The two combat contracts were merged into `COMBAT/RESOLUTION_CONTRACT.md` without promoting any rule. Approved by the owner as "documentation repair".
- 2026-10-11: Owner accepted interpretations I-1 to I-9 and chose the Ultimate timing model "A + Visual only" (P-011). Recorded as PROVISIONAL; the C-009 pause is marked SUPERSEDED rather than deleted.
- 2026-10-11: Owner approved Health clamping (P-012) and Ultimate-first same-timestamp resolution (P-013). Recorded as PROVISIONAL.
- 2026-10-11: Owner approved Option A, Basic Attack dice rolled at commitment (P-014). Recorded as PROVISIONAL, following the convention for owner-approved prototype rules.
- 2026-10-11: Owner approved the four M1 readiness decisions from the implementation-readiness audit: D1 → T-008 (M1 stack), D2 → P-015 (fixture Basic Attack), D3 → T-009 (content check), D4 → P-016 (targeting and defeated attackers). New IDs follow the existing T- and P- series; nothing was renumbered.

## Change process
When the user explicitly approves or changes a decision:
1. Update this register.
2. Update the affected gameplay/technical documents.
3. Update `OPEN_QUESTIONS.md`.
4. Add or adjust acceptance tests before implementation where practical.
