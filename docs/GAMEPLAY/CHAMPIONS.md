# Champions, Ranks, Copies, Levels and Feats

> **Canonical rulebook:** [`docs/rules/04-champions.md`](../rules/04-champions.md) now organises these rules with a status and implementation tag on each, and records later owner decisions. This file is kept as design background; where the two differ, the rulebook says which source wins.

## Champion definition
Every Champion has:
- Unique identity and name.
- Exactly one Race Trait, one Class Trait and one Origin Trait.
- Exactly one Role: Tank, Bruiser, Assassin, Skirmisher, Marksman, Artillery, Mage, Controller or Support.
- A Basic Attack, Passive, Ultimate and two Feat milestones with choices.
- Cost Rank from 1 to 5.
- Level from 1 to 10.

There are exactly 135 Champions (D-017); each Race+Class+Origin combination is unique and each Trait has 9 Champions. Multi-Class is excluded (D-020). The approved roster is `content/roster/champions.json` (D-021); its Roles, costs and ability texts are PROPOSED. The proposed Roles include "Fighter" and "Ranger", which are not in the Role list above (open question).

## Shared pool and copies
- Champions are bought from a shared pool.
- Copy counts decrease as Rank increases, but the exact counts are unresolved.
- Multiple players may level the same Champion.
- Buying a copy of a Champion already owned immediately combines it and levels the Champion.
- **Initial ruleset (D-027):** a player owns at most 12 Champions and there is no selling. The selling rules below describe a later ruleset.
- Selling returns all copies to the shared pool and returns the Champion's full sell value; the precise meaning of “full value” and the sell-value formula need specification.
- When a player is eliminated, all owned Champions/copies return to the shared pool.
- Buying at level 10 and overflow-copy behavior remain unresolved.
- **Prototype (M4) note:** the browser Expedition has no shared pool, no selling and no combining. Its Tavern never offers a Champion the player owns or one reserved for rewards (P-028, P-031), so these full-game rules are not exercised or implemented there.

## Fielding progression
- Consecutive Rounds fielded progress a Champion's level.
- If the Champion is not fielded in a Round, progression pauses rather than resets.
- Exact number of fielded Rounds required per level, whether Monster and PvP rounds count equally, and interactions with duplicate-combining remain unresolved.
- Champions level from 1 to 10.

## Feats
Each Champion has two Feat milestones with choices. Milestone levels, choice counts and whether choices can be changed are unresolved.

## Role list
Tank; Bruiser; Assassin; Skirmisher; Marksman; Artillery; Mage; Controller; Support.

## Proposed Rank multipliers (NOT APPROVED)
Rank multipliers previously suggested: Rank 1–5 = 1.00, 1.18, 1.40, 1.68, 2.00. These must not be applied indiscriminately to attack speed, accuracy, evasion, initiative or other non-scaling values.
