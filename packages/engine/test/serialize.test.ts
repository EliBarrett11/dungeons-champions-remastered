import { describe, expect, it } from 'vitest';
import { canonicalJson, runBattle, serializeEvents } from '../src/index';
import { duel } from './fixtures/roles';

describe('canonicalJson', () => {
  it('sorts object keys at every level and keeps array order', () => {
    expect(canonicalJson({ b: 1, a: { d: [3, 1, 2], c: true } })).toBe('{"a":{"c":true,"d":[3,1,2]},"b":1}');
  });

  it('gives the same text whatever order keys were inserted in', () => {
    expect(canonicalJson({ x: 1, y: 2, z: { q: 1, p: 2 } })).toBe(canonicalJson({ z: { p: 2, q: 1 }, y: 2, x: 1 }));
  });

  it('writes null, booleans, safe integers and escaped strings, with no whitespace', () => {
    expect(canonicalJson([null, false, true, 0, -42, 9007199254740991, 'a"b\\c\n', ''])).toBe(
      '[null,false,true,0,-42,9007199254740991,"a\\"b\\\\c\\n",""]',
    );
  });

  it('writes -0 as 0', () => {
    expect(canonicalJson(-0)).toBe('0');
  });

  it.each([
    ['a fraction', 1.5],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['an unsafe integer', 9007199254740992],
    ['undefined', undefined],
    ['a BigInt', 10n],
    ['a function', () => 1],
    ['a Map', new Map()],
    ['a Date-like class instance', new (class Thing {})()],
  ])('rejects %s', (_name, value) => {
    expect(() => canonicalJson(value)).toThrow(TypeError);
  });

  it('rejects a bad value nested inside an object, naming its path', () => {
    expect(() => canonicalJson({ events: [{ t: 0.5 }] })).toThrow(/\$\.events\[0\]\.t/);
  });

  it('accepts frozen objects and objects without a prototype', () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare['k'] = 1;
    expect(canonicalJson(Object.freeze({ a: Object.freeze([1]) }))).toBe('{"a":[1]}');
    expect(canonicalJson(bare)).toBe('{"k":1}');
  });
});

describe('serializeEvents', () => {
  it('serialises a whole battle log and parses back to the same events', () => {
    const { events } = runBattle(duel());
    const text = serializeEvents(events);
    expect(JSON.parse(text)).toEqual(JSON.parse(JSON.stringify(events)));
    expect(text).not.toMatch(/\s/);
  });
});
