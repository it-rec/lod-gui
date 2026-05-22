import { describe, it, expect } from 'vitest';
import {
  createHero,
  normalizeHero,
  normalizeHeroes,
  DEFAULT_PARTY_SIZE,
  MAX_PARTY,
  MAX_SKILL_RANK,
} from './character';

describe('createHero', () => {
  it('produces a complete hero with a unique id', () => {
    const a = createHero();
    const b = createHero();
    expect(a.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
    expect(a.stamina).toEqual({ current: 10, max: 10 });
    expect(a.skills).toEqual([]);
    expect(a.traits).toEqual([]);
    expect(a.conditions).toEqual([]);
  });
});

describe('normalizeHero', () => {
  it('upgrades a legacy name string into a hero', () => {
    const hero = normalizeHero('Gandalf');
    expect(hero.name).toBe('Gandalf');
    expect(hero.stamina).toEqual({ current: 10, max: 10 });
    expect(hero.id).toBeTruthy();
  });

  it('migrates legacy race/class fields to species/background', () => {
    const hero = normalizeHero({ name: 'Aria', race: 'Elf', class: 'Hunter' });
    expect(hero.species).toBe('Elf');
    expect(hero.background).toBe('Hunter');
  });

  it('clamps current stamina to the maximum', () => {
    const hero = normalizeHero({ name: 'X', stamina: { current: 99, max: 12 } });
    expect(hero.stamina).toEqual({ current: 12, max: 12 });
  });

  it('upgrades legacy string skills to ranked skills', () => {
    const hero = normalizeHero({ skills: ['Athletics', 5, '', 'Stealth'] });
    expect(hero.skills).toEqual([
      { name: 'Athletics', rank: 1 },
      { name: 'Stealth', rank: 1 },
    ]);
  });

  it('preserves ranked skills and clamps the rank', () => {
    const hero = normalizeHero({
      skills: [
        { name: 'Lore', rank: 3 },
        { name: 'Logic', rank: 99 },
      ],
    });
    expect(hero.skills).toEqual([
      { name: 'Lore', rank: 3 },
      { name: 'Logic', rank: MAX_SKILL_RANK },
    ]);
  });

  it('keeps an existing id and drops malformed items', () => {
    const hero = normalizeHero({
      id: 'keep-me',
      items: [{ name: 'Rope', amount: 2 }, null, 'bad'],
    });
    expect(hero.id).toBe('keep-me');
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
