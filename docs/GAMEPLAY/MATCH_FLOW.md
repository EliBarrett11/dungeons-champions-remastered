# Match Flow and Player Rules

> **Canonical rulebook:** [`docs/rules/10-match-flow.md`](../rules/10-match-flow.md) now organises these rules with a status and implementation tag on each, and records later owner decisions. This file is kept as design background; where the two differ, the rulebook says which source wins.

**Status:** DRAFT specification assembled from established design discussions.

## Players and win condition
- A match begins with eight players.
- Each player starts with 100 Health.
- A player is eliminated at 0 Health.
- The last remaining player wins the match.
- After winning the match, the winner fights one additional solo Dragon encounter.
- Players may spectate/select any player at any time, including after elimination.
- All gameplay information is public except the private interaction with an individual player's Tavern.

## Rounds and pairings
- PvP battles are simultaneous 1v1 pairings.
- Pairings are randomized while avoiding opponents faced in the previous three rounds where possible; avoidance has lower priority than making valid pairings.
- If an odd number of players remain, one player fights a PvE opponent whose strength matches the average team quality of the remaining players.
- A player matched against PvE receives baseline Gold and Fame, but no PvP win-streak bonus.
- Ordinary Monster Rounds should be weaker than the team of the currently last-placed player; the special odd-player PvE replacement instead targets average surviving-player team strength.

## Floor routes
- At the start of every Floor, players choose from routes whose rewards, risks and challenges are revealed.
- Route effects persist for that Floor and can modify rewards, PvP conditions, PvE opponents and difficulty.
- Branches converge at the next Floor.
- Floor 1 has three Monster Rounds before the first PvP Round.
- Design target: five Floors and 23 Rounds; elimination decides the actual length (D-022, owner 2026-10-12).
- The exact schedule for subsequent Floors is unresolved; do not hard-code a guessed schedule as final.

## Round loss and player damage
- Damage to a player's Health is based on surviving enemy Champion Health and Round/Floor progression (concept confirmed by the owner as D-028: the Round and the remaining Health of the winning opponent's surviving Champions).
- The exact formula is unresolved. A previously discussed candidate formula was `ceil(H/100 * [1 + 0.10*(R-1) + 0.25*(F-1)])`; this is only a PROPOSAL and must not be treated as approved.
- Run loss and player elimination are distinct: losing a Round ends the player's current Run but does not by itself eliminate the player.

## Match timing
- Intended full-match duration is approximately 40 minutes.
- Even-team battles are intended to present for approximately 20–30 seconds.
- Combat overtime after 30 seconds should increase damage dealt by all units exponentially until a winner emerges; exact formula unresolved.
