import { describe, it, expect } from 'vitest';
import { campaignToMarkdown, filenameForMarkdown } from './campaignMarkdown';

const sample = {
  version: 1,
  exportedAt: '2025-05-25T12:00:00Z',
  game: 1,
  data: {
    heroes: {
      heroes: [
        { id: 'h1', name: 'Sir Talbot', class: 'Paladin', level: 4, xp: 1200, notes: 'Sworn to the **Crown**.' },
        { id: 'h2', name: 'Brom', class: 'Cleric', level: 3, xp: 800, notes: '' },
      ],
    },
    gold: { gold: 142 },
    fame: { fame: 3 },
    calendar: { day: 5, time: 'evening' },
    keywords: { keywords: [{ id: 'k1', text: 'silvermoon' }, { id: 'k2', text: 'blood pact' }] },
    quests: {
      quests: [
        { id: 'q1', title: 'Find the Crown', notes: 'See @{Lord Vrass}', isDone: false, dependsOn: [] },
        { id: 'q2', title: 'Open the gate', notes: '', isDone: false, dependsOn: ['q1'] },
        { id: 'q3', title: 'Deliver the letter', notes: '', isDone: true, dependsOn: [] },
      ],
    },
    npcs: {
      npcs: [
        { id: 'n1', name: 'Sir Talbot', role: 'ally', location: 'The Wounded Boar', notes: '' },
        { id: 'n2', name: 'Lord Vrass', role: 'foe', location: 'Black Tower', notes: 'Demands a tithe.' },
      ],
    },
    locations: {
      locations: [
        { id: 'l1', name: 'Dragonholt', region: 'Terrinoth', status: 'home', notes: '' },
        { id: 'l2', name: 'Black Tower', region: 'Northmark', status: 'rumored', notes: 'Lights burn at dawn.' },
      ],
    },
    journal: {
      entries: [
        { id: 'j1', day: 1, time: 'morning', author: 'Talbot', text: 'Met the steward.' },
        { id: 'j2', day: 1, time: 'evening', author: '', text: 'Set out for the Whispering Wood.' },
        { id: 'j3', day: 2, time: 'afternoon', author: 'Brom', text: 'A red-cloaked stranger watched us.' },
      ],
    },
    inventory: {
      items: [
        { id: 'i1', name: 'Silver ring', quantity: 1, holder: 'Talbot', notes: 'Engraved.' },
        { id: 'i2', name: 'Healing potion', quantity: 3, holder: '', notes: '' },
      ],
    },
    initiative: { combatants: [], round: 1, currentId: null },
    storyPoints: [],
  },
};

describe('campaignToMarkdown', () => {
  it('produces a coherent document with each section in order', () => {
    const md = campaignToMarkdown(sample);
    expect(md).toMatch(/^# Campaign Ledger/);
    // Header block.
    expect(md).toMatch(/Day 5 · Evening/);
    expect(md).toMatch(/2 heroes/);
    expect(md).toMatch(/3 fame/);
    expect(md).toMatch(/142 gold/);
    // Section order.
    const indices = [
      md.indexOf('## The Party'),
      md.indexOf('## Quests'),
      md.indexOf('## People'),
      md.indexOf('## Places'),
      md.indexOf('## Treasure'),
      md.indexOf('## Session Journal'),
      md.indexOf('## Keywords'),
    ];
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    expect(indices.every((i) => i > 0)).toBe(true);
  });

  it('groups quests by active/completed and notes blocked-by parents', () => {
    const md = campaignToMarkdown(sample);
    expect(md).toMatch(/### Active[\s\S]*Find the Crown/);
    expect(md).toMatch(/### Active[\s\S]*Open the gate[\s\S]*Blocked until: Find the Crown/);
    expect(md).toMatch(/### Completed[\s\S]*Deliver the letter/);
  });

  it('groups people by role and locations by status', () => {
    const md = campaignToMarkdown(sample);
    expect(md).toMatch(/### Ally[\s\S]*Sir Talbot/);
    expect(md).toMatch(/### Foe[\s\S]*Lord Vrass.*Black Tower/);
    expect(md).toMatch(/### Home[\s\S]*Dragonholt/);
    expect(md).toMatch(/### Rumored[\s\S]*Black Tower/);
  });

  it('renders journal entries by day, then by phase, with author chips', () => {
    const md = campaignToMarkdown(sample);
    // Day 1 comes before Day 2.
    expect(md.indexOf('### Day 1')).toBeLessThan(md.indexOf('### Day 2'));
    // Phase ordering within day 1: morning then evening.
    const day1 = md.slice(md.indexOf('### Day 1'), md.indexOf('### Day 2'));
    expect(day1.indexOf('Morning')).toBeLessThan(day1.indexOf('Evening'));
    expect(md).toMatch(/Morning · Talbot/);
  });

  it('renders inventory with quantity and holder', () => {
    const md = campaignToMarkdown(sample);
    expect(md).toMatch(/\*\*1× Silver ring\*\* \(Talbot\)/);
    expect(md).toMatch(/\*\*3× Healing potion\*\*/);
  });

  it('skips empty sections gracefully', () => {
    const md = campaignToMarkdown({
      exportedAt: '2025-05-25T12:00:00Z',
      data: { heroes: { heroes: [] } },
    });
    expect(md).not.toMatch(/## The Party/);
    expect(md).not.toMatch(/## Quests/);
    expect(md).toMatch(/^# Campaign Ledger/);
  });

  it('tolerates missing / malformed data', () => {
    expect(() => campaignToMarkdown(null)).not.toThrow();
    expect(() => campaignToMarkdown({})).not.toThrow();
    expect(() => campaignToMarkdown({ data: { heroes: 'not an array' } })).not.toThrow();
  });
});

describe('filenameForMarkdown', () => {
  it('produces a stamped filename', () => {
    expect(filenameForMarkdown(new Date('2025-05-25T17:42:00Z'))).toMatch(
      /^lod-campaign-\d{8}-\d{4}\.md$/
    );
  });
});
