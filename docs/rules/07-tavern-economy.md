# 07 — Tavern and Economy

Tags and conventions: see [00 — Index](00-INDEX.md). Fame purchases: [06](06-fame-renown.md). Reward bundles: [08](08-monsters-rewards.md). Random streams: [11](11-determinism-contracts.md).

This rulebook has two layers:
- **Full game**: §1–§5. These are the rules to build next.
- **Prototype**: §6. This is the exact implemented M4 behaviour, which is the reference implementation of the shared parts.

## 1. Gold

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| ECO-01 | Gold is a whole number, never negative. Unspent Gold carries over between Rounds, and across Runs. | APPROVED DESIGN for whole and non-negative (implemented invariant); carry-over DRAFT for the full game | PROTOTYPE `apps/web/src/game/gold.ts` | `GAMEPLAY/ECONOMY.md`, P-026 |
| ECO-02 | Gold can be spent only in the preparation phase. | PROVISIONAL (prototype); full game follows MATCH-20 | PROTOTYPE `expedition.ts` | P-023 |
| ECO-03 | **Single Gold path.** Every Gold change goes through one function. Invariant: `gold = startingGold + goldEarned − goldSpent`, and `gold ≥ 0`. A spend larger than `gold` is rejected and changes nothing. | PROVISIONAL (technical contract) | IMPLEMENTED `applyGoldChange`, `goldAccountProblems` (`gold.ts`) | M4 checkpoint B |
| ECO-04 | **Starting Gold: 3.** | PROVISIONAL | PROTOTYPE `EXPEDITION_CONFIG.startingGold = 3` | P-032 (full game); P-025 (prototype) |
| ECO-05 | **Income: 5 Gold per Round.** | PROVISIONAL | NOT IMPLEMENTED (the prototype has no base income, P-026) | P-032 |
| ECO-06 | When the 5 Gold is paid: at the start of preparation or after the battle; whether Monster Rounds pay it as well as PvP Rounds; whether Round 1 pays it. | UNRESOLVED (U-06) | — | — |
| ECO-07 | Interest `min(5, floor(Gold held immediately before Round income / 10))`, and win-streak bonus Gold. After a PvP Round they are paid in this order: baseline, then streak, then interest. A player matched against PvE gets the baseline but no streak bonus. | DRAFT. ECONOMY.md calls interest "confirmed", but it is not in the register. The streak schedule is NOT APPROVED. Their relation to P-032 is unresolved. | NOT IMPLEMENTED | `GAMEPLAY/ECONOMY.md`; U-07 |

**Worked example.** This uses only ECO-04 and ECO-05, with no spending, no interest or streaks (U-07), and the payment timing left open (U-06). After *n* income payments, Gold = `3 + 5n`. The Round in which payment *n* happens depends on U-06.

## 2. The Tavern (shop)

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| ECO-20 | The Tavern has **six slots**. It is refreshed automatically, free, at the start of **every preparation phase**, PvP Rounds included. A refresh replaces all six slots, including sold ones. | APPROVED DESIGN | PROTOTYPE: refreshed on each Monster Round (`withNewShop` in `expedition.ts`) | D-025, P-023 |
| ECO-21 | **Reroll ("Purchase a Drink"): 2 Gold.** It replaces all six slots immediately, sold ones included. Allowed only in preparation. | APPROVED DESIGN; value in config | IMPLEMENTED (prototype) `reroll` action, `EXPEDITION_CONFIG.rerollCost = 2` | D-025, P-023 |
| ECO-22 | Each player's Tavern interaction is private. Offers are visible to every player and do not reserve shared-pool copies. | APPROVED DESIGN | NOT IMPLEMENTED (single player) | D-009 |
| ECO-23 | **Rank unlocks and probabilities.** Which cost ranks (1–5) a slot can roll, and with what probability, depends on the player's progression. The owner approved a table for testing, but neither its values nor its index (Renown or Round) is in any project record. | PROVISIONAL (approved for testing); values UNRESOLVED (U-03) | NOT IMPLEMENTED (the prototype draws uniformly over every eligible Champion) | D-025 |
| ECO-24 | **Exhausted-rank fallback.** What a slot does when the rank it rolled has no eligible Champion. The owner approved a fallback, but its rule text is not recorded. | APPROVED DESIGN (existence); rule UNRESOLVED (U-04) | NOT IMPLEMENTED | D-025 |
| ECO-25 | **Eligibility.** In the full game a slot may not offer a Champion that is reserved for this player's rewards (ECO-31). The prototype also excludes owned Champions (P-028). In the full game, buying an owned Champion is meant to combine (CHMP-41), so whether owned Champions are excluded is UNRESOLVED (U-13). Shared-pool availability is also UNRESOLVED (U-13). | APPROVED DESIGN (reservation exclusion, D-026); rest UNRESOLVED | PROTOTYPE `shopCandidates` | D-026, P-028, P-031 |
| ECO-26 | **Full-game prices.** The prototype uses the PROPOSED cost rank as the price (P-024). That is a prototype rule; the full-game price per rank is not decided. | UNRESOLVED (U-27) | PROTOTYPE `generateShop` (`price = costRank`, `priceStatus: 'provisional'`) | P-024 |
| ECO-27 | Locking offers, reroll limits per Round, and free rerolls. | UNRESOLVED (U-29); none exists in the prototype | — | — |

**Full-game slot generation.** This is a structural outline only. Every UNRESOLVED step must be decided before implementation.

```
refreshTavern(player, round):                         # ECO-20, each preparation phase
  stream ← next shop stream number for this player     # DET-21
  for slot in 1..6:
      rank ← draw rank by the unlocked-rank probabilities for the player   # ECO-23, U-03
      candidates ← eligible Champions of that rank (ECO-25)
      if candidates is empty: apply the exhausted-rank fallback          # ECO-24, U-04
      draw one candidate; whether a Champion can repeat within one Tavern is UNRESOLVED (U-03)
  price per slot ← full-game price of the Champion's rank                # ECO-26, U-27
```

## 3. Reward reservations

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| ECO-30 | Each Monster Round offers **six fresh Champion reward options** ([08](08-monsters-rewards.md) MON-20). | APPROVED DESIGN | PROTOTYPE: 2 per Monster Round, 6 per Expedition (P-022) | D-026 |
| ECO-31 | Reward options stay **reserved for the remainder of the match**, including options the player did not take. A reserved Champion never appears in that player's Tavern. | APPROVED DESIGN; the scope of the reservation (this player only, or every player and the shared pool) is UNRESOLVED (U-11) | PROTOTYPE `reservedRewardChampions` (whole Expedition) | D-026, P-031 |
| ECO-32 | **Eligibility arithmetic.** With an owned cap of 12 and 6 new reservations per Monster Round, after *M* Monster Rounds at most `135 − 12 − 6M` Champions are eligible. The total falls below 6 (one Tavern) when *M* ≥ 20. A single rank runs out much earlier: rank 5 has only 18 Champions. So the Round schedule (U-08) and the fallback (U-04) together decide whether every Tavern can be filled. | Derived fact (arithmetic on APPROVED and PROPOSED inputs) | Prototype guard: `contentProblems` refuses content that cannot fill a shop | U-04, U-08, U-14 |

## 4. Ownership

| ID | Rule | Design status | Implementation | Source |
|---|---|---|---|---|
| ECO-40 | A player owns **at most 12 Champions**, counted across every way of gaining one (purchases and rewards). | APPROVED DESIGN | IMPLEMENTED (prototype) `buy` and `chooseReward` guards; `economyStateProblems` | D-027, P-027, P-030 |
| ECO-41 | **No selling** in the initial ruleset. | APPROVED DESIGN | IMPLEMENTED (prototype; no sell action) | D-027 |
| ECO-42 | When 12 are owned: purchases are refused; Champion reward bundles are unavailable; a Gold-only bundle stays available. | PROVISIONAL (prototype); the full-game bundle contents are UNRESOLVED (U-11) | PROTOTYPE `chooseReward` | P-030 |
| ECO-43 | Whether combining a duplicate counts as a new owned Champion. Under "one Champion per identity" it would not. | UNRESOLVED (U-13) | — | — |
| ECO-44 | The starting collection in the full game (the prototype starts with four random roster Champions). | UNRESOLVED (U-12) | PROTOTYPE `startingBenchSize = 4` | P-020, P-022 |

## 5. Purchase validation (shared by the prototype and the full game)

`buy(slot)` checks these in order. The first failure rejects the action; the state is unchanged and a message is shown.

1. Phase is preparation. Otherwise: `"buy" is not available during the … phase.`
2. The slot exists. Otherwise: `Shop slot N does not exist.`
3. The slot is not sold. Otherwise: `That shop offer has already been bought.`
4. Owned < 12 (ECO-40). Otherwise: `Your collection is full (12 Champions).`
5. The Champion exists in the content data.
6. Gold ≥ price (ECO-03). Otherwise: `You cannot afford this Champion (N Gold).`

On success:
- Gold −price (`goldSpent` +price);
- the Champion joins the collection as a new instance (`c<n>`), not placed on the board;
- the slot is marked sold and stays visible until the next refresh or reroll.

`reroll` checks: phase is preparation, and Gold ≥ 2. On success: Gold −2, and the next numbered shop replaces all six slots.

A rejected buy or reroll never changes Gold, the collection, the offers or the shop numbering (`apps/web/test/purchase.test.ts`).

## 6. Prototype economy (IMPLEMENTED; PROVISIONAL P-023 to P-031)

| Element | Prototype behaviour | Code |
|---|---|---|
| Start | 3 Gold, 4 owned, shop 0 generated at creation | `createExpedition` |
| Income | Reward Gold only: bundles of 1 + Champion, 1 + Champion, or 3 Gold | `chooseReward`, `fixtures.ts` |
| Refresh | Free, when continuing to the next Monster Round | `continue` → `withNewShop` |
| Reroll | 2 Gold; preparation only | `reroll` |
| Prices | PROPOSED cost rank, shown as provisional | `generateShop` |
| Eligible | Roster in ID order minus owned minus the six reserved | `shopCandidates` |
| Draw | Partial Fisher–Yates with `rollDie`, from shop stream *k* | `generateShop`, [11](11-determinism-contracts.md) DET-20 |
| Cap | 12 owned; Champion bundles refused at the cap | `buy`, `chooseReward` |
| UI | Unavailable buttons say why: "Need N Gold (you have G)", "Sold", "Collection full (12)" | `apps/web/src/game/shopView.ts` |

**Worked example (prototype).**
1. Start with 3 Gold and shop 0.
2. Buy a rank-2 Champion: 1 Gold left; that slot is sold.
3. Try to reroll: rejected ("You cannot afford a reroll (2 Gold)"). The state is unchanged, and the next shop number is still 1.
4. Win Monster Round 1 and take the 3-Gold bundle: 4 Gold.
5. Continue: shop 1 is generated free.
6. Reroll: 2 Gold left; shop 2 is generated.

## 7. Required tests

**Existing.** All are in `apps/web/test/`:
- `gold` (reconciliation, never negative);
- `shop` (determinism, exclusions, prices equal ranks, stream pinned against independent sfc32 outputs);
- `purchase` (every guard; rejected actions return the identical state; mutation checks);
- `economy-state` (config and state invariants);
- `m4-regression`, `seed-baseline` (pre-M4 seeds unchanged);
- `shop-view`.

**Required for the full game:**
- Income of exactly +5 per qualifying Round, at the approved timing (U-06).
- A Tavern refresh at every preparation phase, Monster and PvP.
- Rank odds: the observed frequencies over many seeds match the configured table within tolerance, and a locked rank is never rolled.
- The exhausted-rank fallback is exercised by forcing an empty rank.
- A reserved Champion is never offered for the rest of the match.
- Ownership stays ≤ 12 on every path.
- No sell action exists.
- "Play my song" accounting (FAME-03).
