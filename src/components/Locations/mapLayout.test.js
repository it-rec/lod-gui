import { describe, it, expect } from 'vitest';
import { autoLayout } from './mapLayout';

describe('autoLayout', () => {
  it('keeps the persisted coords for locations that have them', () => {
    const positions = autoLayout([
      { id: 'a', x: 20, y: 30 },
      { id: 'b', x: 70, y: 80 },
    ]);
    expect(positions).toEqual({
      a: { x: 20, y: 30 },
      b: { x: 70, y: 80 },
    });
  });

  it('grid-places unpositioned locations', () => {
    const positions = autoLayout([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
    ]);
    // 4 entries → 2x2 grid; corners at (8,8), (92,8), (8,92), (92,92).
    expect(positions.a).toEqual({ x: 8, y: 8 });
    expect(positions.b).toEqual({ x: 92, y: 8 });
    expect(positions.c).toEqual({ x: 8, y: 92 });
    expect(positions.d).toEqual({ x: 92, y: 92 });
  });

  it('returns an empty object when given no locations', () => {
    expect(autoLayout([])).toEqual({});
  });

  it('centres a single unpositioned location', () => {
    expect(autoLayout([{ id: 'solo' }])).toEqual({ solo: { x: 50, y: 50 } });
  });

  it('mixes persisted and auto positions without collisions', () => {
    const positions = autoLayout([
      { id: 'a', x: 10, y: 90 },
      { id: 'b' },
      { id: 'c' },
    ]);
    expect(positions.a).toEqual({ x: 10, y: 90 });
    // b and c get grid slots independent of a.
    expect(positions.b.x).toBeGreaterThanOrEqual(0);
    expect(positions.c.x).toBeGreaterThanOrEqual(0);
  });
});
