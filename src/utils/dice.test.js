import { describe, it, expect } from 'vitest';
import {
  parseExpression,
  rollParsed,
  rollExpression,
  MAX_DICE_COUNT,
  MAX_DICE_SIDES,
} from './dice';

// A deterministic RNG: each call returns the next number in the queue. Values
// are in [0, 1) just like Math.random. `0` therefore yields a roll of 1, and a
// value approaching 1 yields the top face.
const fakeRng = (queue) => {
  let i = 0;
  return () => {
    const value = queue[i % queue.length];
    i += 1;
    return value;
  };
};

describe('parseExpression', () => {
  it('parses a bare d-notation as one die', () => {
    expect(parseExpression('d6')).toEqual({
      dice: [{ sign: 1, count: 1, sides: 6 }],
      modifier: 0,
    });
  });

  it('parses an explicit count', () => {
    expect(parseExpression('2d6')).toEqual({
      dice: [{ sign: 1, count: 2, sides: 6 }],
      modifier: 0,
    });
  });

  it('parses a positive modifier', () => {
    expect(parseExpression('2d6+3')).toEqual({
      dice: [{ sign: 1, count: 2, sides: 6 }],
      modifier: 3,
    });
  });

  it('parses a negative modifier', () => {
    expect(parseExpression('d20-1')).toEqual({
      dice: [{ sign: 1, count: 1, sides: 20 }],
      modifier: -1,
    });
  });

  it('parses multiple dice terms and modifiers', () => {
    expect(parseExpression('3d4+2d6+1')).toEqual({
      dice: [
        { sign: 1, count: 3, sides: 4 },
        { sign: 1, count: 2, sides: 6 },
      ],
      modifier: 1,
    });
  });

  it('ignores whitespace and casing', () => {
    expect(parseExpression('  D20 + 2 ')).toEqual({
      dice: [{ sign: 1, count: 1, sides: 20 }],
      modifier: 2,
    });
  });

  it('rejects empty input', () => {
    expect(parseExpression('').error).toBeTruthy();
    expect(parseExpression('   ').error).toBeTruthy();
  });

  it('rejects nonsense', () => {
    expect(parseExpression('hello').error).toBeTruthy();
    expect(parseExpression('d').error).toBeTruthy();
    expect(parseExpression('2d').error).toBeTruthy();
  });

  it('rejects zero-sided or zero-count dice', () => {
    expect(parseExpression('0d6').error).toBeTruthy();
    expect(parseExpression('1d0').error).toBeTruthy();
  });

  it('caps absurd inputs', () => {
    expect(parseExpression(`${MAX_DICE_COUNT + 1}d6`).error).toBeTruthy();
    expect(parseExpression(`1d${MAX_DICE_SIDES + 1}`).error).toBeTruthy();
  });
});

describe('rollParsed', () => {
  it('rolls a single die deterministically', () => {
    const rng = fakeRng([0]); // 0 => face 1
    const result = rollParsed({
      dice: [{ sign: 1, count: 1, sides: 6 }],
      modifier: 0,
    }, rng);
    expect(result.total).toBe(1);
    expect(result.groups[0].rolls).toEqual([1]);
  });

  it('rolls the top face for values near 1', () => {
    const rng = fakeRng([0.99]); // 0.99 => Math.floor(0.99 * 6) + 1 = 6
    const result = rollParsed({
      dice: [{ sign: 1, count: 1, sides: 6 }],
      modifier: 0,
    }, rng);
    expect(result.total).toBe(6);
  });

  it('applies the modifier to the total', () => {
    const rng = fakeRng([0]); // face 1
    const result = rollParsed({
      dice: [{ sign: 1, count: 2, sides: 6 }],
      modifier: 3,
    }, rng);
    expect(result.total).toBe(1 + 1 + 3);
  });

  it('combines several dice groups', () => {
    const rng = fakeRng([0, 0.5, 0.99]);
    const result = rollParsed({
      dice: [
        { sign: 1, count: 2, sides: 6 },
        { sign: 1, count: 1, sides: 4 },
      ],
      modifier: 0,
    }, rng);
    // 2d6: floor(0)+1=1, floor(0.5*6)+1=4. 1d4: floor(0.99*4)+1=4.
    expect(result.total).toBe(1 + 4 + 4);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0].rolls).toEqual([1, 4]);
    expect(result.groups[1].rolls).toEqual([4]);
  });
});

describe('rollExpression', () => {
  it('returns an error object for bad input', () => {
    expect(rollExpression('').error).toBeTruthy();
    expect(rollExpression('garbage').error).toBeTruthy();
  });

  it('returns a roll record for valid input', () => {
    const rng = fakeRng([0.5, 0.5]);
    const result = rollExpression('2d6+1', rng);
    expect(result.error).toBeUndefined();
    expect(result.expression).toBe('2d6+1');
    expect(result.total).toBe(4 + 4 + 1);
    expect(result.modifier).toBe(1);
    expect(result.groups[0].rolls).toEqual([4, 4]);
  });

  it('canonicalises a bare die to "1d…" in the expression', () => {
    const rng = fakeRng([0]);
    const result = rollExpression('d20', rng);
    expect(result.expression).toBe('1d20');
  });
});
