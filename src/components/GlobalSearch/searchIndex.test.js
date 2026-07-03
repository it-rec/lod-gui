import { describe, it, expect, vi } from 'vitest';
import { buildSearchIndex, scoreRecord, searchRecords } from './searchIndex';

// buildSearchIndex fans out over the REST endpoints; feed it a fixed payload
// per collection so the index can be asserted without a server.
vi.mock('../../utils/networkUtils', () => ({
  get: vi.fn(async (path) => {
    if (path.includes('/inventory/')) {
      return {
        items: [
          {
            id: 'it-1',
            name: 'Sword of Embers',
            quantity: 1,
            notes: 'Glows near dragons',
            holder: 'Talia',
          },
        ],
      };
    }
    return null;
  }),
}));
vi.mock('../../utils/localStorageUtil', () => ({
  cacheGet: () => undefined,
}));

const quest = {
  id: 'q1',
  label: 'Find the Lost Crown',
  category: 'Quest',
  detail: 'Last seen with Lord Vrass at the Black Tower',
  meta: 'active',
  target: { panel: 'quests' },
};

const npc = {
  id: 'p1',
  label: 'Sir Talbot',
  category: 'Person',
  detail: 'Owes the party a favour',
  meta: 'The Wounded Boar',
  target: { panel: 'people' },
};

const location = {
  id: 'l1',
  label: 'Dragonholt',
  category: 'Location',
  detail: 'A sleepy village at the forest edge',
  meta: 'Terrinoth',
  target: { panel: 'locations' },
};

describe('scoreRecord', () => {
  it('returns null for an empty query', () => {
    expect(scoreRecord(quest, '')).toBeNull();
    expect(scoreRecord(quest, '   ')).toBeNull();
  });

  it('prefers exact label hits', () => {
    expect(scoreRecord(quest, 'Find the Lost Crown')).toBe(100);
  });

  it('scores label prefix above interior matches', () => {
    const prefix = scoreRecord(quest, 'find');
    const interior = scoreRecord(quest, 'crown');
    expect(prefix).toBeGreaterThan(interior);
  });

  it('falls back to meta and detail matches', () => {
    expect(scoreRecord(npc, 'wounded')).toBeGreaterThan(0);
    expect(scoreRecord(quest, 'vrass')).toBeGreaterThan(0);
  });

  it('returns null when nothing matches', () => {
    expect(scoreRecord(quest, 'unicorn')).toBeNull();
  });

  it('is case insensitive', () => {
    expect(scoreRecord(npc, 'TALBOT')).toBeGreaterThan(0);
  });
});

describe('searchRecords', () => {
  const records = [quest, npc, location];

  it('returns an empty list for an empty query', () => {
    expect(searchRecords(records, '')).toEqual([]);
  });

  it('ranks better hits first', () => {
    const hits = searchRecords(records, 'dragonholt');
    expect(hits[0]).toBe(location);
  });

  it('returns matches across categories', () => {
    const hits = searchRecords(records, 'the');
    expect(hits.map((hit) => hit.category)).toEqual(
      expect.arrayContaining(['Quest', 'Person', 'Location'])
    );
  });

  it('respects the limit', () => {
    const many = Array.from({ length: 50 }).map((_, index) => ({
      ...quest,
      id: `q${index}`,
      label: `Quest ${index} of Crown`,
    }));
    expect(searchRecords(many, 'crown', 5)).toHaveLength(5);
  });
});

describe('buildSearchIndex', () => {
  it('indexes treasure items with their holder and notes', async () => {
    const records = await buildSearchIndex();
    const item = records.find((record) => record.category === 'Item');
    expect(item).toMatchObject({
      id: 'it-1',
      label: 'Sword of Embers',
      detail: 'Glows near dragons',
      meta: 'Talia',
      target: { panel: 'inventory' },
    });
  });
});
