# Trait System

## Taxonomy
Each Champion has exactly three Traits: one Race, one Class and one Origin. Each Champion also has one Role, which is an archetype rather than one of the three Trait slots.

### Classes (15)
Artificer, Barbarian, Bard, Cleric, Druid, Fighter, Gunslinger, Monk, Monster Hunter, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard.

### Origins (15)
Acolyte, Arcane, Cultist, Fey-Touched, Gladiator, Knight, Mercenary, Noble, Outlaw, Pirate, Scholar, Tribal, Undead, Underdark, Witch.

### Races (15)
Aasimar, Dragonborn, Dwarf, Elf, Genasi, Githyanki, Gnome, Goblin, Half-Elf, Halfling, Human, Orc, Shifter, Tiefling, Warforged.

## Breakpoint design targets
- Classes: 2 / 4 / 6 / 8 (no 10-Champion Class bracket in this version).
- Races: 3 / 5 / 7 / 9.
- Origins: 3 / 5 / 7 / 9.

These are confirmed design targets (D-018, superseding D-013). Every Class, Race and Origin has exactly 9 Champions in the roster (D-017), so every top bracket is reachable. Multi-Class is excluded (D-020). Trait effects are not implemented. Exact effects, numeric bonuses, effects at every breakpoint, stacking rules, and interactions remain unresolved.

## Design goals
- Every Trait should have a viable strong late-game vertical build.
- Every Trait should contribute to useful hybrid builds.
- Traits may benefit matching Champions or the entire team, as specified by each Trait.
- Do not assume every Trait effect only benefits units with that Trait.
- Trait counts and bracket activation should be computed from the active field unless a rule explicitly says otherwise.
