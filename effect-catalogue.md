# Battle Effect Catalogue

This is a vocabulary of effect concepts, not a claim that all effects are implemented. Status is **proposed** unless separately approved. Multiple catalogue entries may share one implementation primitive with different configuration.

## Damage types (13)

| Type | Intended identity | Example interactions |
|---|---|---|
| Bludgeoning | Impact/disruption | Stagger, Guard break |
| Piercing | Precision/penetration | Armor penetration, Bleeding |
| Slashing | Wounds/cleave | Bleeding, multi-target strikes |
| Acid | Corrosion | Armor reduction, shield weakening |
| Cold | Slowing/freezing | Chill buildup, Freeze |
| Fire | Burning/spread | Burning, ignition |
| Force | Raw magical impact | Barrier interaction, impact |
| Lightning | Conduction/chaining | Chain between conductive targets |
| Thunder | Shockwave/interruption | Stagger, interrupt |
| Necrotic | Decay/life suppression | Healing reduction, Withered |
| Poison | Toxins/weakening | Poisoned, offense reduction |
| Psychic | Mind/concentration | Confusion, Fear, concentration disruption |
| Radiant | Purification/revelation | Reveal, suppress shadow effects |

Damage type does not automatically apply a status unless the ability explicitly says so.

## Offensive buffs (1–25)

Empowered; Haste; Precision; Deadly Precision; Penetrating; Spell Focus; Executioner; Predator; Rampaging; Overcharged; Fury; Bloodlust; Momentum; Combo; Marked Prey; Flanking Advantage; Spell Echo; Ricochet; Cleave; Guaranteed Follow-up; Charged Attack; Expose Weakness; Overpenetration; Focused Assault; Finisher.

## Defensive buffs (26–45)

Fortified; Warded; Evasive; Guarded; Shielded; Barrier; Deflecting; Parrying; Reflecting; Damage Sharing; Guardian Link; Unstoppable; Tenacious; Cleanse-Proof; Concealed; Untargetable; Regenerating; Death Ward; Last Stand; Iron Will.

## Healing and support (46–60)

Healing; Healing over Time; Enhanced Healing; Lifesteal; Spell Vamp; Shared Recovery; Emergency Healing; Purification; Revival; Overflow Healing; Rally; Inspiration; Rejuvenation; Sacrificial Aid; Shared Vitality.

## Offensive debuffs (61–80)

Weakened; Frail; Exposed; Corroded; Shattered Guard; Inaccurate; Crippled; Spellbound; Silenced; Suppressed; Healing Reduction; Anti-Shield; Resource Drain; Resource Suppression; Vulnerability; Withered; Marked; Revealed; Distracted; Cursed.

## Control and disruption (81–104)

Stunned; Frozen; Rooted; Slowed; Feared; Charmed; Confused; Taunted; Provoked; Dazed; Staggered; Interrupted; Knocked Down; Disarmed; Silenced; Blinded; Deafened; Asleep; Banished; Petrified; Action Lock; Ultimate Lock; Concentration Broken; Forced Retarget.

Rooted, Knocked Down, and displacement-like effects must be adapted to the game's fixed-position board; do not implement movement that contradicts the board rules.

## Damage over time and wounds (105–120)

Burning; Bleeding; Poisoned; Corroding; Chilled; Frostbite; Shocked; Electrified; Necrotic Decay; Withering; Psychic Torment; Radiant Brand; Ruptured; Detonation; Delayed Damage; Doom.

## Marks and target conditions (121–134)

Hunter's Mark; Death Mark; Bounty; Scented; Exposed Core; Soul Brand; Arcane Mark; Linked Targets; Priority Target; Baited; Hunter's Focus; Prey Isolation; Exposed Backline; Shared Fate.

## Resource and Ultimate interactions (135–150)

Resource Surge; Resource Over Time; Resource Refund; Resource Theft; Resource Lock; Resource Amplification; Ultimate Empowerment; Ultimate Acceleration; Ultimate Suppression; Cooldown Reduction; Ability Echo; Ability Copy; Delayed Cast; Counterspell; Spell Reflection; Trigger Conversion.

## Stack, charge, and transformation (151–170)

Stacking Power; Stack Decay; Stack Consumption; Threshold Trigger; Charge; Recharge; Escalation; Adaptation; Transformation; Stance; Berserk; Defensive Stance; Ascension; Overheat; Unstable Power; Sacrifice; Duplicate; Mimicry; Evolution; Countdown.

## Reactions and event triggers (171–190)

Counterattack; Retaliation; Riposte; Thorns; Intercept; Guard Ally; Opportunity Strike; On-Hit Trigger; On-Miss Trigger; On-Critical Trigger; On-Damage Trigger; On-Defeat Trigger; On-Heal Trigger; On-Shield-Break Trigger; On-Control Trigger; On-Ultimate Trigger; On-Resource Threshold; On-Status Trigger; Delayed Reaction; Chain Reaction.

## Saving throws and status interaction (191–205)

Saving Throw; Advantage; Disadvantage; Resistance to Control; Status Resistance; Cleanse; Purge; Dispel; Reapply Protection; Debuff Transfer; Debuff Reflection; Status Conversion; Resistance Break; Immunity; Vulnerability Window.

## Death, survival, and defeat (206–220)

Death-Saving Throw; Stabilized; Death Prevention; Cheat Death; Last Breath; Undying; Rebirth; Soul Anchor; Execute; Death Mark Resolution; Final Stand; Sacrificial Death; Death Burst; Soul Harvest; Revive Lock.

## Battlefield and area effects (221–240)

Burning Ground; Frost Field; Storm Field; Toxic Cloud; Sanctified Ground; Shadow Zone; Protective Ward; Hazard Zone; Safe Zone; Area Denial; Chain Conduction; Shockwave; Splash Damage; Area Vulnerability; Formation Breaker; Protective Formation; Crossfire; Focus Fire; Zone Amplification; Environmental Detonation.

## Catalogue rule

Before adding a new effect, determine whether it can be represented by existing operations plus configuration. Add a new engine operation only when the behavior cannot be expressed clearly and safely with existing primitives.
