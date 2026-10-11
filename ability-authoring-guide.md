# Ability Authoring Guide

## 1. Ability contract

Each ability must define:
- Unique stable ID and player-facing name.
- Status: proposed, approved, implemented, or deprecated.
- Ability kind: basic attack, passive, ultimate, feat, trait, item, or reaction.
- Concise player-facing description.
- Activation condition and resolution window.
- Target side, selector, filters, and fallback.
- Damage components, if any, each with a type and expression.
- Referenced effect IDs and trigger rules.
- Resource behavior where relevant.
- Interruptibility and cost policy.
- Tags and balance notes.

## 2. Champion contract

Every Champion must have exactly:
- One Role Archetype.
- One Class.
- One Race.
- One Origin.
- One Basic Attack.
- One Passive.
- One Ultimate.
- Two Feat milestones, each presenting at least two choices.
- A defined Class Resource and generation rules.

The precise Feat milestone levels and roster-specific values remain configurable until the progression specification is finalized.

## 3. Damage expression syntax

Initial supported grammar:
- `NdM` — roll N independent M-sided dice and sum them.
- `NdM+K` — add a non-negative flat bonus K.
- `NdM-K` — subtract a flat amount K.

Examples: `1d6`, `2d8+13`, `3d4+2`.

Do not permit arbitrary executable expressions. If scaling from Attack or Spell Power is required, represent it in separate schema fields rather than embedding code in a string.

## 4. Targeting

A target selector must be deterministic unless its definition explicitly uses seeded randomness. Role targeting should be implemented through the shared target scoring system. Abilities may override role priorities with explicit target filters or selectors.

Every target selector must define what happens if:
- No valid target exists.
- The target becomes invalid before resolution.
- The target is defeated at the same timestamp.
- A target is concealed, immune, banished, or otherwise unavailable.

## 5. Critical hits

- Standard Champion: natural 1 misses; natural 20 hits and critically hits.
- Rogue: natural 1 misses; natural 16–20 are critical hits under the Rogue rules; proposed critical multiplier 1.5x.
- Sorcerer: natural 1–2 miss; natural 19–20 are critical only if the attack would otherwise hit; natural 20 always hits and crits; Wild Magic from qualifying critical hits and misses.
- Critical rules are centralized and must not be duplicated or independently reinterpreted by individual abilities.
- Every damage component must declare whether it can critically hit. Multi-component critical handling must be centralized.

## 6. Resource and Ultimate rules

- Resource generation is event-driven.
- The Class defines the qualifying event and amount.
- Resource target is configured for the Champion/Ultimate.
- On reaching the target, the Ultimate triggers and resource resets to zero immediately.
- Excess resource does not carry over.
- The initiative opening bonus Ultimate is separate from normal resource activation.
- Simultaneous ready Ultimates enter a queue ordered by initiative, then stable deterministic tie-break.
- Interrupt behavior and whether resource is refunded must be explicit.

## 7. Authoring quality checklist

Before an ability can be approved:
- Is its description consistent with its data?
- Are all referenced IDs registered?
- Are damage types explicit?
- Are all status effects defined?
- Are duration and stacking rules explicit?
- Are trigger timing and frequency explicit?
- Is target fallback explicit?
- Can it create an infinite chain?
- Can it repeatedly trigger its own resource gain?
- Does it respect simultaneous attack semantics?
- Does it specify interrupt and resource-consumption behavior?
- Has its expected power budget been compared with other Champions of similar Cost Rank?
- Are its numerical values marked as provisional or approved?
