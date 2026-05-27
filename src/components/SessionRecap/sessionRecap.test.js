import { describe, it, expect } from 'vitest';
import { summariseRecap, recapToText } from './sessionRecap';

const SAMPLE = {
  calendar: { day: 7, time: 'evening', adventure: 'A Quiet Errand' },
  gold: 42,
  fame: 3,
  heroes: [
    { name: 'Mira' },
    { name: '' },
    { name: 'Bram' },
    { name: 'Sela' },
  ],
  quests: [
    { id: 'q1', title: 'Find the heir', isDone: false },
    { id: 'q2', title: 'Calm the orchard', isDone: true },
    { id: 'q3', title: 'Recover the seal', isDone: false },
  ],
  npcs: [
    { id: 'n1', name: 'Edda', role: 'ally' },
    { id: 'n2', name: 'Halgar', role: 'foe' },
    { id: 'n3', name: 'Toll-keeper', role: 'neutral' },
  ],
  locations: [
    { id: 'l1', name: 'Greycross', status: 'home' },
    { id: 'l2', name: 'The Mill', status: 'visited' },
    { id: 'l3', name: 'Long Barrow', status: 'rumored' },
  ],
  journal: [
    { id: 'j1', day: 7, time: 'evening', text: 'Met Edda at the well.' },
    { id: 'j2', day: 7, time: 'afternoon', text: 'Crossed the bridge.' },
    { id: 'j3', day: 6, time: 'night', text: 'Slept under the oaks.' },
  ],
};

describe('summariseRecap', () => {
  it('aggregates panel data into a structured recap', () => {
    const recap = summariseRecap(SAMPLE);
    expect(recap.adventure).toBe('A Quiet Errand');
    expect(recap.day).toBe(7);
    expect(recap.timeLabel).toBe('Evening');
    expect(recap.party).toEqual(['Mira', 'Bram', 'Sela']);
    expect(recap.counts).toEqual({
      gold: 42,
      fame: 3,
      questsActive: 2,
      questsCompleted: 1,
      allies: 1,
      foes: 1,
      npcsTotal: 3,
      locationsVisited: 2,
      locationsRumored: 1,
      locationsTotal: 3,
    });
    expect(recap.recentJournal).toHaveLength(3);
  });

  it('falls back to "Untitled tale" when the adventure name is blank', () => {
    const recap = summariseRecap({
      ...SAMPLE,
      calendar: { day: 1, time: 'morning', adventure: '   ' },
    });
    expect(recap.adventure).toBe('Untitled tale');
  });

  it('handles missing arrays without throwing', () => {
    const recap = summariseRecap({
      calendar: { day: 1, time: 'morning' },
      gold: undefined,
      fame: undefined,
      heroes: null,
      quests: null,
      npcs: undefined,
      locations: undefined,
      journal: undefined,
    });
    expect(recap.party).toEqual([]);
    expect(recap.counts.gold).toBe(0);
    expect(recap.counts.fame).toBe(0);
    expect(recap.counts.questsActive).toBe(0);
    expect(recap.counts.allies).toBe(0);
    expect(recap.recentJournal).toEqual([]);
  });

  it('limits recent journal entries to the requested count', () => {
    const big = Array.from({ length: 12 }, (_, i) => ({
      id: `j${i}`,
      day: 1,
      time: 'morning',
      text: `Entry ${i}`,
    }));
    const recap = summariseRecap({ ...SAMPLE, journal: big, recentJournalLimit: 4 });
    expect(recap.recentJournal).toHaveLength(4);
    expect(recap.recentJournal[0].text).toBe('Entry 0');
  });
});

describe('recapToText', () => {
  it('renders a Markdown-ish handout', () => {
    const text = recapToText(summariseRecap(SAMPLE));
    expect(text).toContain('# A Quiet Errand');
    expect(text).toContain('Day 7, Evening');
    expect(text).toContain('Party: Mira, Bram, Sela');
    expect(text).toContain('Gold: 42    Fame: 3');
    expect(text).toContain('Quests: 2 active, 1 done');
    expect(text).toContain('People: 3 total (1 allies, 1 foes)');
    expect(text).toContain('Locations: 3 total (2 visited, 1 rumored)');
    expect(text).toContain('- Day 7, Evening — Met Edda at the well.');
  });

  it('omits the journal block when there are no entries', () => {
    const text = recapToText(summariseRecap({ ...SAMPLE, journal: [] }));
    expect(text).not.toContain('Recent journal:');
  });
});
