# Schema Review Checklist

The existing combat package supplies:
- `schemas/effect.schema.json`
- `schemas/ability.schema.json`
- `schemas/champion-combat.schema.json`
- matching templates
- illustrative examples for a storm-themed Champion and Rogue critical passive
- authoring and semantic-validation guidance

These are starter assets, not yet verified canonical contracts.

## Required validation pass
1. Parse every JSON file.
2. Validate each schema against the supported JSON Schema draft using a validator that supports that draft.
3. Validate templates and examples against the relevant schema.
4. Check all `$ref` targets resolve.
5. Check IDs, enums and cross-file references for consistency.
6. Check that required properties reflect documented rules and that optional properties are intentional.
7. Add semantic validation for constraints JSON Schema alone cannot enforce (e.g. unique Champion Race+Class+Origin combinations, item recipe completeness, resource target consistency).
8. Report failures without silently changing gameplay semantics.

Do not install a dependency solely because this document says so; first inspect package manager and existing tools.
