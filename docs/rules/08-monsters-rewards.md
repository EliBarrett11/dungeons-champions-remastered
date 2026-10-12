# 08 — Monster Encounters and Rewards

Tags and conventions: see [00 — Index](00-INDEX.md). Reward reservations in the Tavern: [07](07-tavern-economy.md) §3. Battle resolution: [03](03-combat-engine.md).

## 1. Monster Rounds

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| MON-01 | In a Monster Round, every remaining player fights a PvE battle against monsters, at the same time as the others. | DRAFT (structure); Monster Rounds exist per D-022/D-026 | PROTOTYPE: one player, three fixture encounters | `GAMEPLAY/DUNGEON_AND_REWARDS.md` |
| MON-02 | Floor 1 opens with three Monster Rounds. Which later Rounds are Monster Rounds is not yet decided. | DRAFT (Floor 1); UNRESOLVED (later Rounds, U-08) | PROTOTYPE `encounterCount = 3` | P-018 |
| MON-03 | Ordinary Monster Rounds should be weaker than the team of the current last-placed player. | DRAFT; "last-placed" and the scaling are UNRESOLVED (U-16) | NOT IMPLEMENTED | `GAMEPLAY/DUNGEON_AND_REWARDS.md` |
| MON-04 | The Monster roster, monster stats and abilities, and boss encounters. | UNRESOLVED (U-16) | PROTOTYPE fixtures: monsters with Role-table stats and the fixture Basic Attack (P-021) | — |
| MON-05 | Route modifiers can change PvE opponents and difficulty ([02](02-match-structure.md) MATCH-41). | DRAFT | NOT IMPLEMENTED | — |

**Prototype encounters (IMPLEMENTED, PROVISIONAL; `apps/web/src/game/fixtures.ts`).**
- Encounter 1 has 1 monster (Skirmisher stats), encounter 2 has 2, encounter 3 has 3.
- They are fixtures, not Monster content (P-018, P-021).
- R-001: they are deliberately not retuned for roster teams. The clear rate is about 13% for a front-line-first roster bench.

## 2. Outcomes

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| MON-10 | **Victory** (all monsters defeated, at least one Champion standing) earns a reward choice (§3). | DRAFT (MON-20); the prototype adopts it (PROVISIONAL) | PROTOTYPE `finishBattle` → `reward` phase | P-018 |
| MON-11 | **Defeat or draw** in the full game: player Health damage, Run end, and whether any reward is given. | UNRESOLVED (U-15) | — | — |
| MON-12 | **Prototype defeat or draw**: the Expedition ends at once, with no reward. Player Health is not modelled. | PROVISIONAL (prototype only) | PROTOTYPE `finishBattle` | P-018 |
| MON-13 | A draw is the engine's result for mutual wipe or the 60-second hard stop ([03](03-combat-engine.md) CMB-12). | PROVISIONAL | IMPLEMENTED | P-006 |
| MON-14 | Champions start each battle at full Health. | PROVISIONAL (prototype); full game UNRESOLVED (U-26) | PROTOTYPE | R-004 |

## 3. Rewards

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| MON-20 | After a Monster Round victory, the player is offered **three reward bundles** and chooses one. | DRAFT (three bundles); the prototype adopts three | PROTOTYPE `chooseReward` | `GAMEPLAY/DUNGEON_AND_REWARDS.md`, P-019 |
| MON-21 | Each Monster Round draws **six fresh Champion reward options**. They are reserved for the remainder of the match ([07](07-tavern-economy.md) ECO-31). | APPROVED DESIGN | PROTOTYPE: two per Monster Round (one in each Champion bundle), six drawn when the Expedition is created and reserved for its whole length | D-026; P-022, P-031 |
| MON-22 | How the six Champion options relate to the three bundles. For example, are they spread across the bundles, or does the player choose a Champion from the six? Also: what "fresh" excludes (owned, previously offered, or previously reserved Champions), whether the draw follows the rank odds (ECO-23), and whether the six are drawn per player. | UNRESOLVED (U-11) | — | — |
| MON-23 | Bundles contain an exact Gold amount, Item Components and actual Champions. Bundles should have equal total value but different composition. Rewards are mostly random, with a mild adaptive influence. A long-run fairness budget is intended. | DRAFT; all values UNRESOLVED (U-11) | PROTOTYPE: no Components; bundles of 1 Gold + 1 Champion ×2 and 3 Gold ×1, unbalanced (P-019) | `GAMEPLAY/DUNGEON_AND_REWARDS.md` |
| MON-24 | Reward with a full collection: Champion bundles are unavailable; the Gold-only bundle stays available, so every victory has a valid choice. | PROVISIONAL (prototype) | PROTOTYPE | P-030 |
| MON-25 | A reward is applied exactly once. Its Gold goes through the single Gold path ([07](07-tavern-economy.md) ECO-03). | PROVISIONAL | IMPLEMENTED (prototype) | M2 AC, M4 B |

**Prototype reward claim (IMPLEMENTED, `chooseReward` in `expedition.ts`).**

```
chooseReward(bundleId):
  require phase = reward                                   # else wrong-phase rejection
  bundle ← this encounter's offer with that id             # else "is not offered for this encounter"
  require every Champion id exists in the content
  if bundle has Champions and owned + |bundle.champions| > 12: reject (P-030)
  gold += bundle.gold (single Gold path); add the Champions as new instances
  history += (encounter, victory, bundleId)
  phase ← ended(cleared) if this was Monster Round 3, else decision
```

**Worked example (prototype).** A player owns 12 Champions and wins Monster Round 2.
- `e2-champion-a` and `e2-champion-b` are refused with "Your collection is full (12 Champions)… The Gold-only reward is still available."
- `e2-gold` adds 3 Gold, and the phase becomes `decision`.

## 4. Required tests

**Existing.**
- `apps/web/test/run-flow.test.ts` and `expedition.test.ts`: a reward is applied once; defeat and draw end the Expedition; clearing after Round 3.
- `purchase.test.ts`: refusals at the cap.
- `shop.test.ts`: reserved Champions are never offered.

**Required for the full game:**
- Six fresh options per Monster Round, none previously reserved (per the U-11 answer).
- Reservations persist to the end of the match.
- A valid reward choice exists in every state.
- Monster strength follows MON-03 once it is defined.
- Each outcome applies its approved consequences exactly once.
