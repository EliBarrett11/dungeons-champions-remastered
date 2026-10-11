import { describe, expect, it } from 'vitest';
import { compareActionOrder, sortByActionOrder } from '../src/index';
import type { OrderKey } from '../src/index';

type Keyed = OrderKey & { id: string };

describe('compareActionOrder (P-010)', () => {
  it('higher initiative total acts first', () => {
    expect(compareActionOrder({ initiativeTotal: 15, side: 'B', slot: 9 }, { initiativeTotal: 12, side: 'A', slot: 0 })).toBeLessThan(0);
  });

  it('equal totals: side A before side B', () => {
    expect(compareActionOrder({ initiativeTotal: 12, side: 'A', slot: 11 }, { initiativeTotal: 12, side: 'B', slot: 0 })).toBeLessThan(0);
    expect(compareActionOrder({ initiativeTotal: 12, side: 'B', slot: 0 }, { initiativeTotal: 12, side: 'A', slot: 11 })).toBeGreaterThan(0);
  });

  it('equal totals and side: lower slot first', () => {
    expect(compareActionOrder({ initiativeTotal: 12, side: 'A', slot: 2 }, { initiativeTotal: 12, side: 'A', slot: 5 })).toBeLessThan(0);
  });

  it('identical keys compare equal', () => {
    expect(compareActionOrder({ initiativeTotal: 3, side: 'A', slot: 1 }, { initiativeTotal: 3, side: 'A', slot: 1 })).toBe(0);
  });
});

describe('sortByActionOrder (P-010)', () => {
  const units: Keyed[] = [
    { id: 'b-front', initiativeTotal: 12, side: 'B', slot: 0 },
    { id: 'a-back', initiativeTotal: 12, side: 'A', slot: 9 },
    { id: 'a-front', initiativeTotal: 12, side: 'A', slot: 1 },
    { id: 'b-fast', initiativeTotal: 20, side: 'B', slot: 7 },
    { id: 'a-slow', initiativeTotal: -1, side: 'A', slot: 0 },
  ];

  it('orders by total, then side, then slot', () => {
    expect(sortByActionOrder(units).map((u) => u.id)).toEqual(['b-fast', 'a-front', 'a-back', 'b-front', 'a-slow']);
  });

  it('gives the same order whatever order the input is in', () => {
    const expected = sortByActionOrder(units).map((u) => u.id);
    expect(sortByActionOrder([...units].reverse()).map((u) => u.id)).toEqual(expected);
  });

  it('does not modify its input', () => {
    const copy = [...units];
    sortByActionOrder(units);
    expect(units).toEqual(copy);
  });
});
