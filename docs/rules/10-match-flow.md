# 10 — Full Match Flow

Tags and conventions: see [00 — Index](00-INDEX.md). This rulebook adds no rules of its own. It shows how the rules in rulebooks 02–09 combine, in order. Each step links to its canonical rule. Steps whose order is not decided are marked **UNRESOLVED** and are not filled in by guesswork.

## 1. Full-game match (intended; NOT IMPLEMENTED)

```
MATCH START
  8 players (MATCH-01); match seed fixed (DET-30)
  each player: Health 100 (PVP-01), Gold 3 (ECO-04), Renown 3 (FAME-20), Fame ? (U-01),
               owned Champions ? (U-12), Run 0 (PVP-30)

for round r = 1 .. 23 (MATCH-02) while more than one player remains:
  if r opens a Floor: each player chooses a Route (MATCH-41; U-23)
  type ← Monster or PvP from the approved schedule (MATCH-04; U-08)
                                                    (Floor 1: Rounds 1–3 are Monster Rounds, MATCH-11)

  PREPARATION (MATCH-20) — every remaining player, in private (ECO-22)
    income of 5 Gold, if paid at the start of preparation (ECO-05; timing U-06)
    Round Fame reward, if paid here (FAME-04; U-02)
    Tavern refreshed: 6 new slots (ECO-20), using the rank odds (ECO-23; U-03)
    player actions, in any order, each validated:
        buy (07 §5) · reroll 2 Gold (ECO-21) · "Play my song" 4 Gold → 4 Fame (FAME-03)
        place / remove Champions, up to Renown (FAME-20)
    preparation ends (timer and ready rules: U-36)

  BATTLE (MATCH-22)
    Monster Round: each player vs monsters (MON-01)
    PvP Round: pairings (PVP-11); with an odd count, one player vs PvE (PVP-12)
    all battles run on the combat engine with derived seeds (03; DET-31)

  RESOLUTION — the order of these steps is UNRESOLVED (U-35)
    Monster win: choose 1 of 3 bundles (MON-20); 6 options reserved (MON-21)
    Monster loss or draw: consequences UNRESOLVED (U-15)
    PvP loss: Health −lossDamage (PVP-21/22; U-10); Run ends (PVP-30) → Run-End Upgrade (PVP-40)
    PvP win: streak +1 (PVP-30)
    income / Fame, if paid after the battle (ECO-05, FAME-04; U-06, U-02)
    interest and streak Gold (ECO-07; U-07)
    Renown recomputed from Fame (FAME-21)

  ELIMINATION CHECK
    players at 0 Health are eliminated (PVP-50): Items destroyed (PVP-51), Champions released (PVP-52)
    if exactly one player remains: stop the loop
    if none remain: UNRESOLVED (U-09)

MATCH END
  winner = the last remaining player (MATCH-30); placements (U-09)
  if more than one player remains after Round 23: UNRESOLVED (U-09)
  winner fights the solo Dragon (CORE-03; rules U-23)
```

## 2. Prototype Expedition (IMPLEMENTED; PROVISIONAL P-018 to P-031)

This is the flow the code runs today (`apps/web/src/game/expedition.ts`):

```
createExpedition(seed):  Gold 3; 4 roster Champions drawn; 6 reward Champions drawn and reserved;
                         shop 0 generated; phase = preparation, encounter 1
preparation:  buy · reroll · place / remove (1–3 fielded) · startBattle
battle:       the engine result is fixed at startBattle; finishBattle moves on
reward:       chooseReward (Gold through the single path; Champions up to the cap of 12)
decision:     continue (new shop, next encounter)  |  endExpedition (retreated)
ended:        cleared / defeated / draw / retreated  →  newExpedition(seed)
```

| Full-game element | Prototype stand-in | Rulebook |
|---|---|---|
| 23 Rounds, mixed Monster and PvP | 3 Monster Rounds | 02 |
| Player Health | none; a defeat or draw ends the run | 09 |
| 5 Gold income per Round | none; reward Gold only | 07 |
| Renown fielding 3–12 | fixed 1–3 | 06 |
| Tavern rank odds | uniform draw over the eligible roster | 07 |
| 6 fresh reward options per Monster Round | 6 per Expedition, 2 per Round | 08 |

## 3. Interaction checks an implementation must test

Each check names the rules that interact.

1. **Gold ordering.** The order of income, interest and spending decides how much interest is earned. Interest uses "Gold held immediately before Round income" (ECO-07). It can be implemented only once U-06 and U-07 fix the payment point.
2. **Renown timing.** If "Play my song" raises Renown during preparation, whether the new capacity applies in the same Round depends on U-01 (FAME-25).
3. **Reservations and rank odds.** Reservations remove Champions from the Tavern for the rest of the match. Together with the rank odds, they decide when a rank is exhausted and the fallback runs (ECO-32, U-04).
4. **Cap 12 and rewards.** A valid reward choice must exist at the cap (ECO-42). The full-game bundle contents must preserve this (U-11).
5. **Elimination and reservations.** Whether an eliminated player's reserved options return to circulation is not decided (PVP-52, U-11).

## 4. Required tests (when implemented)

- A seeded 8-bot match simulation: the same seed and the same bot policies give an identical match log and hash.
- Every Round, every remaining player passes through preparation, battle and resolution exactly once.
- Invariants hold after every step:
  - Gold reconciles and is ≥ 0;
  - Health is from 0 to 100;
  - Renown is from 3 to 12;
  - owned ≤ 12;
  - fielded ≤ Renown;
  - no reserved Champion is offered;
  - an eliminated player takes no further actions.
- The match ends at the first Round with one survivor, or by the U-09 rule.
