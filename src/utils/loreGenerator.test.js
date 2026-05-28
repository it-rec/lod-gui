import { describe, it, expect } from 'vitest';
import {
  generateTavern,
  generateNpc,
  generateWeather,
  GENERATORS,
} from './loreGenerator';

// A deterministic RNG so each `pick(arr)` returns the array's first item.
const zeroRng = () => 0;
// And the last item — exercises the upper bound of `Math.floor(rng * n)`.
const nearlyOneRng = () => 0.9999;

describe('loreGenerator', () => {
  it('generates a tavern name from the qualifier+subject tables', () => {
    expect(generateTavern(zeroRng)).toMatch(/Crooked.+Crow|Crow/);
    expect(generateTavern(nearlyOneRng)).toMatch(/[A-Za-z]+/);
  });

  it('generates an NPC name with a role suffix', () => {
    const npc = generateNpc(zeroRng);
    expect(npc).toContain(',');
    expect(npc).toMatch(/^[A-Z]/);
  });

  it('generates weather as a "sky + ground" sentence', () => {
    const weather = generateWeather(zeroRng);
    expect(weather).toMatch(/\./);
    expect(weather.length).toBeGreaterThan(20);
  });

  it('exposes the three generators in the GENERATORS table', () => {
    expect(Object.keys(GENERATORS).sort()).toEqual(['npc', 'tavern', 'weather']);
    for (const { generate, label } of Object.values(GENERATORS)) {
      expect(typeof generate).toBe('function');
      expect(typeof label).toBe('string');
    }
  });

  it('produces different results across many invocations (random sanity check)', () => {
    const seen = new Set();
    for (let i = 0; i < 30; i += 1) seen.add(generateTavern());
    expect(seen.size).toBeGreaterThan(1);
  });
});
