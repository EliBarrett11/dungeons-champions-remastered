import { describe, expect, it } from 'vitest';
import { assertValidBattleInput, InvalidBattleInputError, validateBattleInput } from '../src/index';
import type { BattleInput, ValidationError } from '../src/index';
import { duel, roleUnit } from './fixtures/roles';
import type { Role } from './fixtures/roles';

// Tests deliberately build malformed inputs, so drafts are untyped.
type Draft = any;

/** Deep copy of a valid duel, changed by `change`, returned as unknown input. */
function variant(change: (draft: Draft) => void, base: BattleInput = duel()): unknown {
  const draft: Draft = JSON.parse(JSON.stringify(base));
  change(draft);
  return draft;
}

function paths(errors: readonly ValidationError[]): string[] {
  return errors.map((e) => e.path);
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

const U0 = 'participants[0].units[0]';

describe('valid inputs', () => {
  it('a Role-table duel is valid', () => {
    expect(validateBattleInput(duel())).toEqual([]);
  });

  it('five units per side covering every role, slots 0 and 11, extreme seeds', () => {
    const roles: Role[] = ['tank', 'bruiser', 'assassin', 'skirmisher', 'marksman', 'artillery', 'mage', 'controller', 'support', 'tank'];
    const units = roles.map((role, i) => roleUnit(`u${i}`, role, [0, 3, 7, 10, 11][i % 5]!));
    for (const seed of [0, 4294967295]) {
      const input: BattleInput = {
        seed,
        participants: [
          { id: 'left', units: units.slice(0, 5) },
          { id: 'right', units: units.slice(5) },
        ],
      };
      expect(validateBattleInput(input)).toEqual([]);
    }
  });

  it('accepts boundary and negative values that no rule forbids', () => {
    const input = variant((d) => {
      Object.assign(d.participants[0].units[0].stats, {
        health: 1, attack: -5, armor: 0, accuracy: -3, evasion: -2, attackSpeedMilli: 1, initiativeModifier: -2,
      });
      Object.assign(d.participants[1].units[0].stats, { attackSpeedMilli: 1_000_000, health: 1_000_000_000 });
      d.participants[0].units[0].basicAttack.scalingRatioBp = 0;
      d.participants[1].units[0].basicAttack.scalingRatioBp = 50_000;
      d.participants[0].units[0].basicAttack.dice = '1d4-8';
      d.participants[1].units[0].basicAttack.dice = '2d8+13';
    });
    expect(validateBattleInput(input)).toEqual([]);
  });

  it('the same slot on different sides is allowed', () => {
    expect(validateBattleInput(variant((d) => { d.participants[1].units[0].slot = 0; }))).toEqual([]);
  });

  it('does not modify the input (deep-frozen input validates)', () => {
    expect(validateBattleInput(deepFreeze(duel()))).toEqual([]);
  });
});

describe('top-level shape', () => {
  it.each([null, undefined, 42, 'battle', [], true])('rejects %j as the whole input', (input) => {
    expect(paths(validateBattleInput(input))).toEqual(['input']);
  });
});

describe('seed (uint32)', () => {
  it.each([
    ['missing', undefined],
    ['negative', -1],
    ['above uint32', 4294967296],
    ['fractional', 1.5],
    ['string', '12345'],
    ['NaN', Number.NaN],
  ])('rejects a %s seed', (_name, seed) => {
    expect(paths(validateBattleInput(variant((d) => { d.seed = seed; })))).toEqual(['seed']);
  });
});

describe('participants', () => {
  it.each([['missing', undefined], ['object', {}], ['string', 'p0,p1']])('rejects %s participants', (_name, value) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants = value; })))).toEqual(['participants']);
  });

  it('rejects zero, one or three participants', () => {
    expect(paths(validateBattleInput(variant((d) => { d.participants = []; })))).toEqual(['participants']);
    expect(paths(validateBattleInput(variant((d) => { d.participants.pop(); })))).toEqual(['participants']);
    const three = variant((d) => {
      d.participants.push({ id: 'p2', units: [roleUnit('p2-mage', 'mage', 0)] });
    });
    expect(paths(validateBattleInput(three))).toEqual(['participants']);
  });

  it('still validates each participant when the count is wrong', () => {
    const errors = validateBattleInput(variant((d) => { d.participants.pop(); d.participants[0].units[0].stats.health = 0; }));
    expect(paths(errors)).toEqual(['participants', `${U0}.stats.health`]);
  });

  it.each([null, 7, 'p0', []])('rejects participant %j that is not an object', (value) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[1] = value; })))).toEqual(['participants[1]']);
  });

  it.each([['missing', undefined], ['empty', ''], ['number', 5]])('rejects a %s participant id', (_name, id) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].id = id; })))).toEqual(['participants[0].id']);
  });

  it('rejects duplicate participant ids', () => {
    const errors = validateBattleInput(variant((d) => { d.participants[1].id = 'p0'; }));
    expect(paths(errors)).toEqual(['participants[1].id']);
    expect(errors[0]!.message).toContain('participants[0].id');
  });
});

describe('units per participant (1 to 5)', () => {
  it.each([['missing', undefined], ['object', {}]])('rejects %s units', (_name, units) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units = units; })))).toEqual(['participants[0].units']);
  });

  it('rejects zero units', () => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[1].units = []; })))).toEqual(['participants[1].units']);
  });

  it('rejects six units', () => {
    const six = Array.from({ length: 6 }, (_, i) => roleUnit(`x${i}`, 'mage', i));
    expect(paths(validateBattleInput(variant((d) => { d.participants[1].units = six; })))).toEqual(['participants[1].units']);
  });

  it('accepts exactly five units', () => {
    const five = Array.from({ length: 5 }, (_, i) => roleUnit(`x${i}`, 'mage', i));
    expect(validateBattleInput(variant((d) => { d.participants[1].units = five; }))).toEqual([]);
  });

  it.each([null, 3, 'unit'])('rejects unit %j that is not an object', (value) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0] = value; })))).toEqual([U0]);
  });
});

describe('unit ids', () => {
  it.each([['missing', undefined], ['empty', ''], ['number', 1]])('rejects a %s unit id', (_name, id) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].id = id; })))).toEqual([`${U0}.id`]);
  });

  it('rejects a duplicate unit id within one participant', () => {
    const input = variant((d) => { d.participants[0].units.push({ ...d.participants[0].units[0], slot: 1 }); });
    expect(paths(validateBattleInput(input))).toEqual(['participants[0].units[1].id']);
  });

  it('rejects a duplicate unit id across participants', () => {
    const errors = validateBattleInput(variant((d) => { d.participants[1].units[0].id = 'p0-tank'; }));
    expect(paths(errors)).toEqual(['participants[1].units[0].id']);
    expect(errors[0]!.message).toContain(`${U0}.id`);
  });
});

describe('slots (0 to 11, unique within a side)', () => {
  it.each([
    ['negative', -1],
    ['above 11', 12],
    ['fractional', 1.5],
    ['string', '3'],
    ['missing', undefined],
  ])('rejects a %s slot', (_name, slot) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].slot = slot; })))).toEqual([`${U0}.slot`]);
  });

  it('rejects a duplicate slot on the same side', () => {
    const input = variant((d) => { d.participants[0].units.push({ ...d.participants[0].units[0], id: 'p0-second' }); });
    expect(paths(validateBattleInput(input))).toEqual(['participants[0].units[1].slot']);
  });
});

describe('stats', () => {
  it.each([null, 5, []])('rejects stats %j that are not an object', (value) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].stats = value; })))).toEqual([`${U0}.stats`]);
  });

  const STATS = ['health', 'attack', 'armor', 'accuracy', 'evasion', 'attackSpeedMilli', 'initiativeModifier'];
  const NOT_INTEGERS: [string, unknown][] = [
    ['missing', undefined],
    ['fractional', 2.5],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['string', '10'],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1],
  ];
  for (const stat of STATS) {
    it.each(NOT_INTEGERS)(`rejects ${stat} that is %s`, (_name, value) => {
      const errors = validateBattleInput(variant((d) => { d.participants[0].units[0].stats[stat] = value; }));
      expect(paths(errors)).toEqual([`${U0}.stats.${stat}`]);
    });
  }

  it.each([0, -1])('rejects Health %i (must be positive)', (health) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].stats.health = health; })))).toEqual([`${U0}.stats.health`]);
  });

  it('rejects negative Armor', () => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].stats.armor = -1; })))).toEqual([`${U0}.stats.armor`]);
  });

  it.each([0, -650, 1_000_001])('rejects attack speed %i', (speed) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].stats.attackSpeedMilli = speed; })))).toEqual([`${U0}.stats.attackSpeedMilli`]);
  });

  it.each(['accuracy', 'evasion', 'attack', 'initiativeModifier', 'health', 'armor'])('rejects %s beyond the 1,000,000,000 magnitude limit', (stat) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].stats[stat] = 1_000_000_001; })))).toEqual([`${U0}.stats.${stat}`]);
  });
});

describe('basic attack', () => {
  const BA = `${U0}.basicAttack`;

  it.each([null, 'slash', []])('rejects a basic attack %j that is not an object', (value) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].basicAttack = value; })))).toEqual([BA]);
  });

  it.each([
    ['missing', undefined],
    ['number', 8],
    ['uppercase D', '1D8'],
    ['zero dice', '0d8'],
    ['spaces', '1d8 + 1'],
    ['too many dice', '101d8'],
    ['too many sides', '1d1001'],
  ])('rejects a %s dice expression', (_name, dice) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].basicAttack.dice = dice; })))).toEqual([`${BA}.dice`]);
  });

  it.each([['spellPower'], ['none'], [undefined]])('rejects scaling stat %j', (scalingStat) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].basicAttack.scalingStat = scalingStat; })))).toEqual([`${BA}.scalingStat`]);
  });

  it.each([-1, 50_001, 1.5, undefined])('rejects scaling ratio %s', (ratio) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].basicAttack.scalingRatioBp = ratio; })))).toEqual([`${BA}.scalingRatioBp`]);
  });

  it.each([['fire'], ['slashing'], [undefined]])('rejects damage type %j', (damageType) => {
    expect(paths(validateBattleInput(variant((d) => { d.participants[0].units[0].basicAttack.damageType = damageType; })))).toEqual([`${BA}.damageType`]);
  });
});

describe('collecting every error', () => {
  const broken = variant((d) => {
    d.seed = -1;
    d.participants[0].units[0].stats.health = 0;
    d.participants[0].units[0].slot = 12;
    d.participants[1].units[0].basicAttack.dice = 'bad';
    d.participants[1].units[0].id = 'p0-tank';
    d.participants[1].units[0].stats.armor = -5;
  });

  it('reports all problems at once, in input order', () => {
    expect(paths(validateBattleInput(broken))).toEqual([
      'seed',
      `${U0}.slot`,
      `${U0}.stats.health`,
      'participants[1].units[0].id',
      'participants[1].units[0].stats.armor',
      'participants[1].units[0].basicAttack.dice',
    ]);
  });

  it('several errors in one stat block are all reported', () => {
    const errors = validateBattleInput(variant((d) => {
      Object.assign(d.participants[0].units[0].stats, { health: 0, armor: -1, accuracy: 0.5, attackSpeedMilli: 0 });
    }));
    expect(paths(errors)).toEqual([
      `${U0}.stats.health`, `${U0}.stats.armor`, `${U0}.stats.accuracy`, `${U0}.stats.attackSpeedMilli`,
    ]);
  });

  it('is deterministic: the same input gives the same errors', () => {
    expect(validateBattleInput(broken)).toEqual(validateBattleInput(broken));
  });

  it('every error has a path and a message', () => {
    for (const error of validateBattleInput(broken)) {
      expect(error.path.length).toBeGreaterThan(0);
      expect(error.message.length).toBeGreaterThan(0);
    }
  });
});

describe('assertValidBattleInput (runBattle input check)', () => {
  it('returns normally for a valid input', () => {
    expect(() => assertValidBattleInput(duel())).not.toThrow();
  });

  it('throws InvalidBattleInputError carrying every error', () => {
    const input = variant((d) => { d.seed = 1.5; d.participants[1].units = []; });
    let thrown: unknown;
    try {
      assertValidBattleInput(input);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(InvalidBattleInputError);
    const invalid = thrown as InvalidBattleInputError;
    expect(invalid.name).toBe('InvalidBattleInputError');
    expect(paths(invalid.errors)).toEqual(['seed', 'participants[1].units']);
    expect(invalid.message).toContain('2 errors');
    expect(invalid.message).toContain('participants[1].units');
  });
});

describe('no battle execution or randomness before validation passes', () => {
  it('an invalid seed is reported, not thrown by the generator (no generator is created)', () => {
    expect(() => validateBattleInput(variant((d) => { d.seed = -1; }))).not.toThrow();
  });

  it('validate.ts never creates or draws from a random-number generator', () => {
    const source = Object.values(import.meta.glob<string>('../src/validate.ts', { eager: true, query: '?raw', import: 'default' }))[0]!;
    expect(source).not.toMatch(/\bnew\s+(Sfc32|BattleRng)\b/);
    expect(source).not.toMatch(/\bnextUint32\b|\brollDie\b|\brollDice\b|\brollDiceExpression\b/);
  });
});
