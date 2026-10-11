import { describe, expect, it } from 'vitest';
import { BattleRng, drawSideAssignment } from '../src/index';
import { ScriptedRng } from './support/scripted-rng';

describe('side assignment parity (I-5)', () => {
  it.each([0, 2, 4294967294])('even u = %s: participant 0 is side A', (u) => {
    const result = drawSideAssignment(new ScriptedRng([u]));
    expect(result).toEqual({ u, sideAParticipant: 0, sideBParticipant: 1 });
  });

  it.each([1, 3, 4294967295])('odd u = %s: participant 1 is side A', (u) => {
    const result = drawSideAssignment(new ScriptedRng([u]));
    expect(result).toEqual({ u, sideAParticipant: 1, sideBParticipant: 0 });
  });

  it('consumes exactly one draw', () => {
    const rng = new ScriptedRng([7, 8]);
    drawSideAssignment(rng);
    expect(rng.drawCount).toBe(1);
  });

  it('uses the first output after seeding (reference seeds)', () => {
    // First outputs from the independent reference: seed 12345 -> 235160590 (even),
    // seed 0 -> 1363572419 (odd).
    const even = new BattleRng(12345);
    expect(drawSideAssignment(even)).toEqual({ u: 235160590, sideAParticipant: 0, sideBParticipant: 1 });
    expect(even.drawCount).toBe(1);

    const odd = new BattleRng(0);
    expect(drawSideAssignment(odd)).toEqual({ u: 1363572419, sideAParticipant: 1, sideBParticipant: 0 });
  });

  it('both outcomes occur across seeds, so listing order is not permanently favoured', () => {
    const sideA = new Set<number>();
    for (let seed = 0; seed < 32; seed++) {
      sideA.add(drawSideAssignment(new BattleRng(seed)).sideAParticipant);
    }
    expect([...sideA].sort()).toEqual([0, 1]);
  });
});
