import { describe, it, expect } from 'vitest';
import {
  createHero,
  normalizeHero,
  normalizeHeroes,
  DEFAULT_PARTY_SIZE,
  MAX_PARTY,
} from './character';

describe('createHero', () => {
  it('produces a complete hero with a unique id', () => {
    const a = createHero();
    const b = createHero();
    expect(a.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
    expect(a.stamina).toEqual({ current: 10, max: 10 });
    expect(a.level).toBe(1);
  });
});

describe('normalizeHero', () => {
  it('upgrades a legacy name string into a hero', () => {
    const hero = normalizeHero('Gandalf');
    expect(hero.name).toBe('Gandalf');
    expect(hero.level).toBe(1);
    expect(hero.stamina).toEqual({ current: 10, max: 10 });
    expect(hero.id).toBeTruthy();
  });

  it('clamps current vitality to the maximum', () => {
    const hero = normalizeHero({ name: 'X', stamina: { current: 99, max: 12 } });
    expect(hero.stamina).toEqual({ current: 12, max: 12 });
  });

  it('keeps an existing id and drops malformed skills and items', () => {
    const hero = normalizeHero({
      id: 'keep-me',
      skills: ['Climb', 5, '', 'Stealth'],
      items: [{ name: 'Rope', amount: 2 }, null, 'bad'],
    });
    expect(hero.id).toBe('keep-me');
    expect(hero.skills).toEqual(['Climb', 'Stealth']);
    expect(hero.items).toEqual([{ name: 'Rope', amount: 2 }]);
  });
});

describe('normalizeHeroes', () => {
  it('seeds a default party when there is nothing stored', () => {
    expect(normalizeHeroes([])).toHaveLength(DEFAULT_PARTY_SIZE);
    expect(normalizeHeroes(undefined)).toHaveLength(DEFAULT_PARTY_SIZE);
  });

  it('migrates a legacy array of name strings', () => {
    const party = normalizeHeroes(['Aria', 'Borin', '']);
    expect(party.map((hero) => hero.name)).toEqual(['Aria', 'Borin', '']);
  });

  it('caps the party at the maximum size', () => {
    expect(normalizeHeroes(Array(9).fill('hero'))).toHaveLength(MAX_PARTY);
  });
});
