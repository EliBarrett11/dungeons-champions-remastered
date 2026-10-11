# Economy: Gold, Fame, Renown and Tavern

**Status:** relationships are partly CONFIRMED; exact balance values remain TUNABLE or UNRESOLVED.

## Gold
- Gold is a match resource and persists across Runs.
- After a PvP Round, players receive baseline Gold, then win-streak bonus Gold, then interest.
- A player matched against PvE receives baseline Gold but no PvP win-streak bonus.
- Interest is confirmed as: `min(5, floor(Gold held immediately before Round income / 10))`.
- Initial Gold, baseline income, rank prices, sell value, shop odds and experience prices are unresolved/tunable.

## Tavern
- The Tavern refreshes automatically every Round.
- Each Tavern shows six shop slots.
- “Purchase a Drink” costs 2 Gold and rerolls all six slots.
- Shop offers are visible to all players, but each player's Tavern interaction is private.
- Shop offers do not reserve copies from the shared Champion pool.

## Fame and Renown
- Fame and Renown persist across Runs.
- Renown begins at 1 and is capped at 12 (D-019: maximum team size 12; formerly 10). Renown is not implemented in the prototype.
- A player may field one Champion per Renown level.
- Fame determines Renown, but exact thresholds are unresolved.
- Tavern Bard action “Play my song” costs 4 Gold and grants 4 Fame.

## Win streaks and Runs
- Each player has an individual Run/win streak.
- Losing a Round ends that player's Run and resets the win streak, but does not eliminate the player.
- Win streaks grant bonus Gold; the exact schedule and whether streaks carry across Floors need approval.
- A Run-End Upgrade is granted based on Health lost in the latest Round that ended the Run, not cumulative Health loss.
- Player chooses one of three randomly generated balanced upgrade options; tier reflects the latest loss.
- Run-End Upgrades are permanent for the rest of the match and should be system-wide rather than Champion-specific.
- Ending a Run does not reset team, items, Champion levels, Feats, fielding progression, Gold, Fame or Renown.
- Selected Run-End Upgrades are public.

## Provisional streak schedule (NOT APPROVED)
A prior proposal was: 1 win +0; 2–3 wins +1; 4–5 wins +2; 6–7 wins +3; 8+ wins +3 (cap). Keep this in configuration only if the user approves a provisional prototype value.

## Prototype economy for the single-player Expedition (M4, PROVISIONAL)
Owner-approved on 2026-10-11 as prototype rules (`DECISIONS.md` P-023 to P-031). **Implemented in M4** (the browser Tavern on the preparation screen). They are PROVISIONAL prototype rules, not final balance. They apply to the browser Expedition only and do not settle the match economy above (Gold income after PvP Rounds, interest, streaks, shared pool and shop odds remain as documented or unresolved).
- **Tavern:** six slots; refreshed automatically each Monster Round; reroll ("Purchase a Drink") 2 Gold, replacing all six slots (P-023).
- **Prices:** shop price = the Champion's PROPOSED roster cost rank, 1–5 Gold. Provisional; not final balance (P-024).
- **Starting Gold:** 3 per new Expedition; resets to 3 when a new Expedition begins (P-025).
- **Income:** only the existing victory reward choices (unchanged: 1 Gold + Champion, 1 Gold + Champion, or 3 Gold). No base income, interest or streak bonuses in the prototype. Gold carries between rounds within an Expedition (P-026).
- **Capacity:** at most 12 owned Champions from all sources; starting collection 4; fielding 1–3 (P-027). At 12, the Champion reward bundles are disabled and the 3-Gold bundle stays available (P-030).
- **Duplicates:** owned Champions and all six of the Expedition's reserved reward Champions (for the whole Expedition, including ones passed up) are never offered; no combining (P-028, P-031).
- **Randomness:** a separate seeded shop stream; existing battles, bench, reward draws and replays unchanged; a rejected action never changes the shop or its numbering (P-029).
- **Out of scope:** selling, duplicate combining, interest, streak bonuses, XP and levels.
