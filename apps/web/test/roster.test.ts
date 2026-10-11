import { describe, expect, it } from 'vitest';
import rosterJson from '../../../content/roster/champions.json';
import { ROSTER_RULES, TRAIT_CANON, validateRoster } from '../src/game/roster';

type Mutable = { champions: Record<string, unknown>[] } & Record<string, unknown>;

/** A deep copy of the real roster that a test may break. */
function copy(): Mutable {
  return JSON.parse(JSON.stringify(rosterJson)) as Mutable;
}

const errorsOf = (roster: unknown) => validateRoster(roster).errors;

describe('the approved roster (D-017 to D-021)', () => {
  const result = validateRoster(rosterJson);

  it('passes strict validation with no errors', () => {
    expect(result.errors).toEqual([]);
    expect(result.roster).not.toBeNull();
  });

  it('has 135 Champions with 135 unique Class/Race/Origin combinations', () => {
    const champions = rosterJson.champions;
    expect(champions).toHaveLength(ROSTER_RULES.size);
    expect(new Set(champions.map((c) => `${c.class}|${c.race}|${c.origin}`)).size).toBe(135);
    expect(new Set(champions.map((c) => c.id)).size).toBe(135);
  });

  it('assigns exactly 9 Champions to every one of the 45 traits', () => {
    const champions = rosterJson.champions;
    for (const [kind, names] of [['class', TRAIT_CANON.classes], ['race', TRAIT_CANON.races], ['origin', TRAIT_CANON.origins]] as const) {
      expect(names).toHaveLength(15);
      for (const name of names) expect(champions.filter((c) => c[kind] === name)).toHaveLength(9);
    }
  });

  it('uses the exact approved trait names', () => {
    expect(TRAIT_CANON.classes).toEqual([
      'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Gunslinger', 'Monk',
      'Monster Hunter', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
    ]);
    expect(TRAIT_CANON.races).toEqual([
      'Aasimar', 'Dragonborn', 'Dwarf', 'Elf', 'Genasi', 'Githyanki', 'Gnome', 'Goblin',
      'Half-Elf', 'Halfling', 'Human', 'Orc', 'Shifter', 'Tiefling', 'Warforged',
    ]);
    expect(TRAIT_CANON.origins).toEqual([
      'Acolyte', 'Arcane', 'Cultist', 'Fey-Touched', 'Gladiator', 'Knight', 'Mercenary', 'Noble',
      'Outlaw', 'Pirate', 'Scholar', 'Tribal', 'Undead', 'Underdark', 'Witch',
    ]);
  });

  it('keeps no Multi-Class text in playable data (D-020) and warns about PROPOSED Roles', () => {
    const text = JSON.stringify(rosterJson.champions.map((c) => c.proposed));
    expect(text).not.toMatch(/secondary .* Trait|multi-?class/i);
    expect(rosterJson.champions.filter((c) => 'excluded' in c)).toHaveLength(24);
    expect(result.warnings).toEqual([
      'PROPOSED Role "Fighter" (11 Champions) is not one of the nine documented Roles; the prototype uses a placeholder stat block.',
      'PROPOSED Role "Ranger" (11 Champions) is not one of the nine documented Roles; the prototype uses a placeholder stat block.',
      '24 Champions have Multi-Class Feat text excluded from playable data (D-020).',
    ]);
  });
});

describe('roster validation rejects invalid rosters', () => {
  it('rejects a roster that is not 135 Champions', () => {
    const short = copy();
    short.champions.pop();
    expect(errorsOf(short)[0]).toBe('The roster has 134 Champions; exactly 135 are required (D-017).');
    const long = copy();
    long.champions.push({ ...long.champions[0]!, id: 'DC-136' });
    expect(errorsOf(long)).toContain('The roster has 136 Champions; exactly 135 are required (D-017).');
  });

  it('rejects missing, malformed and duplicate IDs', () => {
    const roster = copy();
    delete roster.champions[0]!.id;
    roster.champions[1]!.id = 'dc_2';
    roster.champions[2]!.id = 'DC-004';
    expect(errorsOf(roster)).toEqual(
      expect.arrayContaining([
        'Champion #1 has a missing or blank ID.',
        'Champion #2 (dc_2): ID must look like DC-001.',
        'Champion #4 (DC-004): duplicate ID (also Champion #3).',
      ]),
    );
  });

  it('rejects missing or blank names', () => {
    const roster = copy();
    roster.champions[5]!.name = '   ';
    delete roster.champions[6]!.name;
    expect(errorsOf(roster)).toEqual([
      'Champion #6 (DC-006) has a missing or blank name.',
      'Champion #7 (DC-007) has a missing or blank name.',
    ]);
  });

  it('rejects unexpected Class, Race and Origin names (and the resulting distribution)', () => {
    const roster = copy();
    roster.champions[0]!.class = 'Multi-Class';
    roster.champions[1]!.race = 'Half-Orc';
    roster.champions[2]!.origin = 'acolyte';
    const errors = errorsOf(roster);
    expect(errors).toEqual(
      expect.arrayContaining([
        'Champion #1 (DC-001): class "Multi-Class" is not one of the approved Classes.',
        'Champion #2 (DC-002): race "Half-Orc" is not one of the approved Races.',
        'Champion #3 (DC-003): origin "acolyte" is not one of the approved Origins.',
        'Class Artificer has 8 Champions; exactly 9 are required (D-017).',
      ]),
    );
  });

  it('rejects a duplicate Class/Race/Origin combination even when every trait still has 9 Champions', () => {
    // Make Champion X copy Champion Y's combination, then move three other Champions so that every
    // Class, Race and Origin count stays at 9: only the duplicate-combination rule can catch it.
    const roster = copy();
    const all = roster.champions as { id: string; class: string; race: string; origin: string }[];
    const [x, y] = [all[0]!, all[1]!];
    const others = all.slice(2);
    others.find((c) => c.class === y.class)!.class = x.class;
    others.find((c) => c.race === y.race)!.race = x.race;
    others.find((c) => c.origin === y.origin)!.origin = x.origin;
    Object.assign(x, { class: y.class, race: y.race, origin: y.origin });
    const errors = errorsOf(roster);
    expect(errors).toContain(`Champion #2 (DC-002): duplicate Class/Race/Origin combination ${y.class} / ${y.race} / ${y.origin} (also DC-001).`);
    expect(errors.filter((e) => e.includes('Champions; exactly 9'))).toEqual([]);
  });

  it('rejects an uneven trait distribution even when every combination is still unique', () => {
    // Swap one Champion's Class for another's without a compensating move: counts become 10 and 8.
    const roster = copy();
    const all = roster.champions as { class: string; race: string; origin: string }[];
    const donor = all.find((c) => c.class !== all[0]!.class)!;
    const before = donor.class;
    donor.class = all[0]!.class;
    const errors = errorsOf(roster);
    expect(errors).toEqual(
      expect.arrayContaining([
        `Class ${all[0]!.class} has 10 Champions; exactly 9 are required (D-017).`,
        `Class ${before} has 8 Champions; exactly 9 are required (D-017).`,
      ]),
    );
    expect(errors.filter((e) => e.includes('duplicate Class/Race/Origin'))).toEqual([]);
  });

  it('rejects Multi-Class or other unexpected fields', () => {
    const roster = copy();
    roster.champions[0]!.secondary_class = 'Monk';
    expect(errorsOf(roster)).toEqual([
      'Champion #1 (DC-001) has an unexpected field "secondary_class" (Multi-Class and other new mechanics are not active).',
    ]);
  });

  it('rejects invalid fields the application needs (cost rank, Role, proposed block)', () => {
    const roster = copy();
    (roster.champions[0]!.proposed as Record<string, unknown>).cost_rank = 6;
    (roster.champions[1]!.proposed as Record<string, unknown>).role = '';
    delete roster.champions[2]!.proposed;
    expect(errorsOf(roster)).toEqual([
      'Champion #1 (DC-001): proposed cost rank must be a whole number from 1 to 5.',
      'Champion #2 (DC-002): proposed role is missing or blank.',
      'Champion #3 (DC-003) has no proposed content block.',
    ]);
  });

  it('does not require the optional second Feat text, but rejects it if blank or also excluded', () => {
    const roster = copy();
    delete (roster.champions[0]!.proposed as Record<string, unknown>).feat_milestone_2;
    expect(errorsOf(roster)).toEqual([]);
    (roster.champions[1]!.proposed as Record<string, unknown>).feat_milestone_2 = ' ';
    const excludedOne = roster.champions.find((c) => 'excluded' in c)!;
    (excludedOne.proposed as Record<string, unknown>).feat_milestone_2 = 'Back again';
    expect(errorsOf(roster)).toEqual([
      'Champion #2 (DC-002): proposed feat_milestone_2 is blank.',
      `Champion #${roster.champions.indexOf(excludedOne) + 1} (${String(excludedOne.id)}): feat_milestone_2 is both present and excluded.`,
    ]);
  });

  it('rejects non-objects and an unknown format', () => {
    expect(errorsOf(null)).toEqual(['The roster is not an object.']);
    expect(errorsOf({ format: 'x' })).toEqual(['Unknown roster format "x"; expected "dc-roster-v1".', 'The roster has no champions list.']);
    expect(validateRoster(copy()).roster).not.toBeNull();
  });
});
