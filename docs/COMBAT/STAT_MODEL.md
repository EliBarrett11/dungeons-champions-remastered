# Stat Model and Balance Proposals

## Core stat concepts
The following stats have been proposed: Health, Attack, Spell Power, Armor, Magic Resistance, Accuracy, Evasion, Attack Speed, Initiative Modifier and Critical Damage Bonus. Class Resource rules are class-specific. The canonical final stat list is not yet approved.

## Role Rank 1 stat proposal (NOT APPROVED)
Values are proposed starting points for simulation, not final balance.

| Role | HP | Attack | Spell Power | Armor | MR | Accuracy | Evasion | Attacks/sec |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Tank | 900 | 35 | 20 | 60 | 45 | +1 | +1 | 0.65 |
| Bruiser | 760 | 65 | 25 | 40 | 30 | +2 | +2 | 0.80 |
| Assassin | 520 | 75 | 35 | 15 | 20 | +3 | +5 | 1.00 |
| Skirmisher | 620 | 50 | 30 | 25 | 25 | +2 | +6 | 1.10 |
| Marksman | 500 | 70 | 20 | 15 | 20 | +5 | +2 | 1.00 |
| Artillery | 480 | 90 | 45 | 10 | 15 | +3 | +1 | 0.65 |
| Mage | 500 | 25 | 85 | 10 | 30 | +2 | +2 | 0.75 |
| Controller | 560 | 30 | 65 | 20 | 35 | +3 | +3 | 0.75 |
| Support | 620 | 25 | 55 | 25 | 40 | +2 | +2 | 0.75 |

## Proposed growth and caps (NOT APPROVED)
- Rank multipliers proposed: Rank 1–5 = 1.00, 1.18, 1.40, 1.68, 2.00.
- Per-level growth proposed: Health +8%; Attack/Spell Power +6%; Armor/MR +5%; Accuracy/Evasion/Attack Speed/Initiative +0.
- Candidate formula: `round(S1 * (1 + g)^(L - 1))`.
- Attack Speed cap proposed at 2.0 attacks/second.
- Initiative Modifier range proposed at −2 to +5.
- Critical multipliers proposed: standard 2x, Rogue 1.5x, Sorcerer 2x.

## Balancing method
Evaluate damage, durability, utility and reliability through simulation rather than simplistic universal stat weights. Keep all tuning values in config. These values are not approved until the user explicitly accepts them.
