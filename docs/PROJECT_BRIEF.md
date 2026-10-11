# Project Brief

## Product vision
Dungeons & Champions is a browser-based, D&D-inspired auto-battler with eight players, team-building and economy decisions, automated combat, and a roguelite dungeon journey. Players prepare teams and position Champions; battles resolve automatically. The intended full-match duration is approximately 40 minutes.

## Core experience
- Eight players compete in simultaneous rounds.
- Players acquire Champions, build Trait synergies, equip items, manage Gold and other progression systems, and choose routes through a dungeon.
- PvP battles run in parallel. Monster rounds and dungeon route choices add PvE variety and risk/reward decisions.
- The last player standing wins the match, then faces an additional solo Dragon fight.
- Players may spectate and select any player at any time, including after elimination.
- Gameplay information is public. Each player's Tavern interaction is private, but Tavern offers are visible to everyone. Shop offers do not reserve shared-pool copies.

## Roster shape
- The roster has exactly 135 Champions (D-017); the approved assignments are in `content/roster/champions.json` (D-021).
- Maximum team size: 12 Champions fielded (D-019).
- Each Champion has exactly three Traits: one Race, one Class and one Origin.
- Each Champion has exactly one of nine Roles: Tank, Bruiser, Assassin, Skirmisher, Marksman, Artillery, Mage, Controller or Support.
- Each Champion has a Basic Attack, Passive, Ultimate and two Feat milestones with choices.
- Champion levels run from 1 to 10. Duplicate combining and fielding progression are both intended systems; exact interactions are tracked in `OPEN_QUESTIONS.md`.
- Each Race+Class+Origin combination is unique, and each Class, Race and Origin has exactly 9 Champions. Multi-Class is excluded (D-020).

## Trait taxonomy
**Classes (15):** Artificer, Barbarian, Bard, Cleric, Druid, Fighter, Gunslinger, Monk, Monster Hunter, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard.

**Origins (15):** Acolyte, Arcane, Cultist, Fey-Touched, Gladiator, Knight, Mercenary, Noble, Outlaw, Pirate, Scholar, Tribal, Undead, Underdark, Witch.

**Races (15):** Aasimar, Dragonborn, Dwarf, Elf, Genasi, Githyanki, Gnome, Goblin, Half-Elf, Halfling, Human, Orc, Shifter, Tiefling, Warforged.

**Trait brackets (D-018):** Classes 2 / 4 / 6 / 8; Races 3 / 5 / 7 / 9; Origins 3 / 5 / 7 / 9.

## Match and combat goals
- Combat should be readable, tactical through pre-battle composition and positioning, and fully automated.
- Battles between even teams are intended to last around 20–30 seconds in presentation.
- The design includes D&D-inspired dice, critical hits, damage types, saving throws, status effects, death saves and class resources.
- Every Trait should support a meaningful vertical build and useful hybrid builds.
- The full game should be data-driven so Champions, abilities, effects, Traits, items and balance values can be authored and validated without rewriting engine code.

## Status and scope
This is a draft master brief based on prior design discussions. See `DECISIONS.md` and `OPEN_QUESTIONS.md`. Not every number or edge case has been approved. Do not use this brief alone as permission to invent missing mechanics.
