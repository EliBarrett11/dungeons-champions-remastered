# 05 — Traits and Synergies

Tags and conventions: see [00 — Index](00-INDEX.md). Trait names and the roster assignments are canonical in `docs/COMBAT/schemas/roster.schema.json` and `content/roster/champions.json` ([04](04-champions.md) CHMP-01 to CHMP-04).

## 1. Taxonomy

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| TRT-01 | There are 45 Traits: 15 Classes, 15 Races and 15 Origins. Each Champion has exactly one of each. | APPROVED DESIGN | IMPLEMENTED (roster validation) | D-002, D-017 |
| TRT-02 | Each Trait is held by exactly 9 Champions, so every top bracket can be reached. | APPROVED DESIGN | IMPLEMENTED (roster validation) | D-017 |
| TRT-03 | Multi-Class is excluded: a Champion never counts as a second Class. | APPROVED DESIGN | IMPLEMENTED | D-020 |

## 2. Brackets (breakpoints)

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| TRT-10 | Bracket targets: Classes 2 / 4 / 6 / 8 (no 10-Champion Class bracket in this version); Races 3 / 5 / 7 / 9; Origins 3 / 5 / 7 / 9. | APPROVED DESIGN (design target) | NOT IMPLEMENTED (the prototype shows Traits, with no counts or effects) | D-018 |
| TRT-11 | Trait counts are computed from the **active field** (the fielded Champions), unless a Trait's rule says otherwise. | DRAFT | NOT IMPLEMENTED | `GAMEPLAY/TRAITS.md` |
| TRT-12 | **How a Champion counts toward a Trait.** Whether two fielded copies of the same Champion can exist, and whether each would count, depends on the combining rules (U-13). Under the prototype's no-duplicates rule (P-028), each fielded Champion contributes exactly 1 to each of its three Traits. | UNRESOLVED for the full game (U-13, U-20) | — | — |
| TRT-13 | A bracket is active when the count reaches it. A higher bracket replaces the lower one or adds to it, depending on the Trait's effect definition. | UNRESOLVED (U-20) | NOT IMPLEMENTED | — |

## 3. Effects and interactions

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| TRT-20 | Trait effects and numbers at every bracket. | UNRESOLVED (U-20) | NOT IMPLEMENTED | B6 |
| TRT-21 | A Trait may benefit matching Champions or the whole team, as its definition states. Do not assume only units with the Trait benefit. | DRAFT (design goal) | — | `GAMEPLAY/TRAITS.md` |
| TRT-22 | Every Trait should support a strong vertical build and useful hybrid builds. This is a design goal for content authoring, not an executable rule. | DRAFT (design goal) | — | `PROJECT_BRIEF.md` |
| TRT-23 | Stacking with Items and other effects, timing (battle start or continuous), and recalculation when a Champion is defeated. | UNRESOLVED (U-20) | NOT IMPLEMENTED | — |

## 4. Executable specification (counting only; effects remain UNRESOLVED)

Counting can be specified and tested now. It uses only APPROVED DESIGN inputs, plus the DRAFT "active field" basis, which must be confirmed (U-20) before it ships.

```
traitCounts(field):                     # field = the fielded Champions
  counts ← map Trait → 0
  for champion in field:
      counts[champion.class]  += 1
      counts[champion.race]   += 1
      counts[champion.origin] += 1
  return counts

activeBracket(trait, count):            # TRT-10 thresholds by Trait family
  thresholds ← CLASS_BRACKETS [2,4,6,8] | RACE_BRACKETS [3,5,7,9] | ORIGIN_BRACKETS [3,5,7,9]
  return the largest t in thresholds with t ≤ count, or none
```

**Worked example.** A field of three Champions, all Fighters, two of them Dwarves:
- Fighter count 3: Class bracket **2** is active (4 is not).
- Dwarf count 2: no Race bracket (the minimum is 3).

**Edge cases.**
- A count above the top bracket keeps the top bracket. Example: 9 Fighters keep bracket 8.
- With an empty field, every count is 0.

## 5. Required tests (when implemented)

- Counting a field gives exactly 3 contributions per fielded Champion.
- The bracket boundaries for each family are exact (count = threshold − 1, threshold, and top bracket + 1).
- A bench (unfielded) Champion contributes nothing, if the active-field basis is confirmed.
- Trait effects come from content data, never from code constants.
- An unknown Trait name is rejected by validation.
