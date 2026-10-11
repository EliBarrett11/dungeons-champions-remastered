import { describe, expect, it } from 'vitest';
import { M1_CONFIG } from '../src/index';

describe('engine scaffold', () => {
  it('exposes a frozen M1 config through the public entry point', () => {
    expect(Object.isFrozen(M1_CONFIG)).toBe(true);
  });

  it('uses the provisional prototype values from the ruleset', () => {
    expect(M1_CONFIG.hardStopMs).toBe(60_000);
    expect(M1_CONFIG.overtimeStartMs).toBe(30_000);
    expect(M1_CONFIG.overtimeStepMs).toBe(5_000);
    expect(M1_CONFIG.acBase).toBe(10);
    expect(M1_CONFIG.critMultiplier).toBe(2);
    expect(M1_CONFIG.armorConstant).toBe(100);
    expect(M1_CONFIG.minDamageOnHit).toBe(1);
    expect(M1_CONFIG.ratioDenominator).toBe(10_000);
    expect(M1_CONFIG.attackSpeedDenominator).toBe(1_000);
    expect(M1_CONFIG.boardSlots).toBe(12);
    expect(M1_CONFIG.maxUnitsPerSide).toBe(5);
  });
});
