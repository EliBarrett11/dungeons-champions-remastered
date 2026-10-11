# Semantic Validation Checklist

JSON Schema validates shape. A separate game-aware validator must validate meaning.

## Errors (block implementation)

1. Unknown effect, ability, resource, stat, damage type, or selector ID.
2. Persistent effect with no expiration/removal rule.
3. Stack mode requiring a cap but no cap is defined.
4. Damage operation without a damage type.
5. Control effect without duration, removal behavior, and resistance/immunity behavior.
6. Ultimate missing a resource target unless explicitly marked as a separate opening bonus.
7. Resource definition allows carry-over despite the established reset-to-zero rule.
8. Trigger cycle with no recursion limit.
9. Target selector has no fallback policy.
10. Unsupported custom operation or resolution window.
11. An effect modifies a stat that does not exist in the stat registry.
12. Damage expression does not match supported dice grammar.

## Warnings (review required)

1. A Champion has multiple sources of the same resistance and may exceed intended limits.
2. A control effect duration exceeds the configured cap.
3. A Champion can apply hard control repeatedly without diminishing returns.
4. A reflection or chain effect can recursively trigger itself.
5. Resource gain can occur once per damage tick when design intended once per attack.
6. An Ultimate's resource target or generation rate predicts more than the target activation budget.
7. A damage-type interaction lacks counterplay.
8. An ability can leave no valid target for the opposing team indefinitely.
9. An ability depends on board movement when the board is fixed-position.
10. An effect claims to cleanse or dispel a status that is not removable.
11. A damage modifier can be applied twice through both operation and passive hooks.
12. A critical rule duplicates class-wide critical behavior.

## Suggested tests

- Schema validation for every JSON file.
- Reference validation for all effect and ability IDs.
- Seeded battle replay equivalence.
- No negative Health/Resource values unless an explicitly allowed internal state requires it.
- No infinite event loop under chain/reflection/trigger combinations.
- Simultaneous lethal attacks both resolve if committed.
- Ultimate queue ordering stable across runs.
- Resource resets to zero on trigger with no excess carry-over.
- Natural-roll exceptions correctly applied.
- Damage components independently apply type-specific defenses.
