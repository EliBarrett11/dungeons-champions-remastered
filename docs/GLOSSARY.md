# Glossary

Definitions are taken from the existing documentation; the source is given for each. The rules themselves, with status and implementation tags, are in `docs/rules/` (start at `00-INDEX.md`). Where the documents do not define something, the entry says UNRESOLVED and points to `OPEN_QUESTIONS.md`. This glossary does not create rules.

## Match structure

| Term | Meaning | Source |
|---|---|---|
| **Match** | One complete game for eight players, from the start until one player remains (the winner), followed by the winner's solo Dragon fight. Target length about 40 minutes. | `PROJECT_BRIEF.md`, `GAMEPLAY/MATCH_FLOW.md`, D-001, D-006, D-007 |
| **Round** | One stage of the match in which every remaining player fights once, simultaneously. Either a **PvP Round** or a **Monster Round**. | `GAMEPLAY/MATCH_FLOW.md` |
| **PvP Round** | A Round in which players are paired 1v1 against each other. With an odd number of players, one player fights a PvE opponent instead. | `GAMEPLAY/MATCH_FLOW.md` |
| **Monster Round** | A PvE Round against monsters; winning offers a choice of three reward bundles. | `GAMEPLAY/DUNGEON_AND_REWARDS.md` |
| **Floor** | A section of the dungeon made of several Rounds. At the start of each Floor players choose a Route. Floor 1 has three Monster Rounds before the first PvP Round. Design target: five Floors, 23 Rounds (D-022); later schedules: UNRESOLVED. | `GAMEPLAY/MATCH_FLOW.md` |
| **Route** | A path chosen at the start of a Floor, with revealed rewards, risks and challenges that persist for that Floor. Routes converge at the next Floor. | `GAMEPLAY/DUNGEON_AND_REWARDS.md` |
| **Run** | A player's current winning streak. Losing a Round ends the Run and resets the win streak, but does **not** eliminate the player and does not reset team, items, levels, Gold, Fame or Renown. (Note: unlike many roguelites, a "Run" here is not the whole game.) | `GAMEPLAY/ECONOMY.md` |
| **Expedition (M2 prototype only)** | The browser prototype's playable session: up to three Monster Rounds with a reward choice after each victory, ending on defeat, draw, a voluntary end or a clear. A prototype term, not a game rule; named so it is not confused with **Run**. | `DECISIONS.md` P-018 |
| **Run-End Upgrade** | A permanent, public, system-wide upgrade chosen from three options when a Run ends; its tier depends on Health lost in the Round that ended the Run. | `GAMEPLAY/ECONOMY.md` |
| **Battle** | A single automated combat between two sides (two players' teams, or a player and monsters). | `COMBAT/RESOLUTION_CONTRACT.md` |
| **Elimination** | A player reaching 0 Health. Distinct from losing a Run. | D-006, `GAMEPLAY/MATCH_FLOW.md` |
| **Dragon fight** | A solo encounter the match winner plays after winning. Its rules and consequences: UNRESOLVED. | D-007 |

## Player resources

| Term | Meaning | Source |
|---|---|---|
| **Health (player)** | Starts at 100; 0 means elimination. Reduced by losing Rounds; formula UNRESOLVED. | D-006, `GAMEPLAY/MATCH_FLOW.md` |
| **Gold** | Match currency used in the Tavern. Persists across Runs. Earned as baseline income, win-streak bonus and interest. | `GAMEPLAY/ECONOMY.md` |
| **Interest** | `min(5, floor(Gold held immediately before Round income / 10))`. | `GAMEPLAY/ECONOMY.md` |
| **Fame** | Persistent resource that determines Renown; e.g. "Play my song" costs 4 Gold and grants 4 Fame. Thresholds UNRESOLVED. | `GAMEPLAY/ECONOMY.md` |
| **Renown** | Starts at 3 (D-023, superseding the earlier "starts at 1"), capped at 12 (D-019). Not implemented in the prototype. A player may field one Champion per Renown level. Whether it also acts as "player level" for shop odds: UNRESOLVED. | `GAMEPLAY/ECONOMY.md` |
| **Tavern** | The shop: six slots, refreshed automatically at every preparation phase, Monster and PvP Rounds alike (D-025). Each player's interaction is private; offers are visible to all and reserve nothing. | `GAMEPLAY/ECONOMY.md`, D-009 |
| **Drink ("Purchase a Drink")** | Costs 2 Gold and rerolls all six Tavern slots. Adopted for the prototype Expedition by P-023 and implemented in M4 (2 Gold, replaces all six offers). | `GAMEPLAY/ECONOMY.md`, P-023 |
| **Reserved reward Champions (prototype)** | The six roster Champions drawn when an Expedition starts for its victory reward choices (two per Monster Round). Reserved for the whole Expedition, including ones passed up; the M4 shop never offers them. Not related to the shared pool (D-009). | P-022, P-028, P-031 |
| **Owned Champions / collection (prototype)** | Every Champion the player owns in an Expedition (the UI calls it the bench). Starts at four; at most 12 from all sources (P-027, P-030). Fielding is limited separately to 1–3. | P-020, P-027, P-030 |

## Champions

| Term | Meaning | Source |
|---|---|---|
| **Champion** | A unit with one Race, one Class, one Origin, one Role, a Basic Attack, Passive, Ultimate and two Feat milestones. | D-002, D-004, `GAMEPLAY/CHAMPIONS.md` |
| **Rank** | Cost tier 1–5. Higher Ranks have fewer copies in the shared pool. | `GAMEPLAY/CHAMPIONS.md` |
| **Level** | 1–10. Raised by combining copies and by fielding progression; exact rules UNRESOLVED. | D-005, `GAMEPLAY/CHAMPIONS.md` |
| **Copy** | One purchasable instance of a Champion in the shared pool. Buying a copy of an owned Champion combines immediately. | `GAMEPLAY/CHAMPIONS.md` |
| **Shared pool** | The common supply of Champion copies all players buy from. Sizes UNRESOLVED. | `GAMEPLAY/CHAMPIONS.md` |
| **Fielding / fielding progression** | Having a Champion on the board in a Round. Consecutive fielded Rounds progress its level; not fielding pauses (does not reset) progress. | D-005, `GAMEPLAY/CHAMPIONS.md` |
| **Trait** | Class (15), Race (15) or Origin (15). Each Champion has exactly one of each, and each Trait has 9 Champions. Bracket targets: Classes 2/4/6/8, Races 3/5/7/9, Origins 3/5/7/9. | D-002, D-017, D-018, `GAMEPLAY/TRAITS.md` |
| **Multi-Class** | A Champion counting as a second Class. Excluded (D-020); not implemented. | D-020 |
| **Roster** | The 135 approved Champions in `content/roster/champions.json`; assignments approved, other fields PROPOSED. | D-021 |
| **Role** | One of nine archetypes (Tank, Bruiser, Assassin, Skirmisher, Marksman, Artillery, Mage, Controller, Support). Not a Trait. | D-002 |
| **Feat** | A choice offered at each of a Champion's two Feat milestones. Milestone levels UNRESOLVED. | D-004 |
| **Component / Item** | Nine Components; any two combine automatically into one of 45 completed Items. Max three completed Items per Champion. | D-010, D-011, `GAMEPLAY/ITEMS.md` |

## Combat

| Term | Meaning | Source |
|---|---|---|
| **Initiative total** | `d20 + Initiative Modifier`, rolled by every Champion at battle start. | C-001, P-008 |
| **Opening bonus Ultimate** | An extra Ultimate granted to the Champion(s) with the highest initiative; separate from resource-triggered Ultimates. | C-001, C-002, C-008 |
| **Basic Attack** | A Champion's repeating attack on its own timer, independent of initiative. | C-004 |
| **Class Resource** | A per-Class meter filled by class-specific events; reaching its target triggers the Ultimate and resets it to 0. | C-006, C-007 |
| **Ultimate** | A Champion's major ability, triggered by its Class Resource (or the opening bonus). Resolves at the timestamp it triggers, before Basic Attacks committed at that timestamp, and never pauses Basic Attack timers; its animation is presentation only. | C-007, C-008, C-010, P-011, P-013 |
| **Timestamp** | A point on the integer-millisecond combat timeline. Actions due at the same timestamp resolve simultaneously. | C-005, P-002 |
| **Commitment (of a Basic Attack)** | The stage, at a timestamp, in which a due Basic Attack's target and inputs are fixed, its d20 and (on a hit) damage dice are rolled, and on a hit its complete damage is calculated; all of this is stored. Health does not change at commitment. Commitment happens before any action at that timestamp resolves; the stored outcome is applied later, after ready Ultimates. | P-013, P-014 |
| **Overtime** | Escalating damage after 30 seconds of combat. | C-018, P-006 |
| **Natural roll** | The unmodified d20 result; it decides automatic hits/misses and critical ranges. | C-012 to C-014 |
| **Effect** | A reusable, data-defined combat operation (damage, status, shield, …). The 240-entry effect catalogue is a list of concepts, not implemented effects. | `COMBAT/EFFECT_CATALOGUE_STATUS.md` |
