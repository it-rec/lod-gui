import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LootSplitter, { splitEvenly } from './LootSplitter';

// Per-channel mock state — the LootSplitter touches heroes, gold, journal
// and calendar, so each `useGameChannel(...)` call gets its own state.
const channels = {
  heroes: { value: [] },
  gold: { value: 0 },
  journal: { value: [] },
  calendar: { value: { day: 1, time: 'morning' } },
};

vi.mock('../../hooks/useGameChannel', () => ({
  useGameChannel: ({ channel, fromServer }) => {
    const state = channels[channel];
    return {
      value: fromServer ? fromServer(state.value) : state.value,
      save: vi.fn((next) => {
        state.value = next;
      }),
      loading: false,
      error: null,
      reload: vi.fn(),
    };
  },
}));

vi.mock('../../shared', () => ({
  collections: {
    HEROES: 'heroes',
    GOLD: 'gold',
    JOURNAL: 'journal',
    CALENDAR: 'calendar',
  },
  gamePath: (collection) => `/api/game/1/${collection}/`,
}));

beforeEach(() => {
  channels.heroes.value = {
    heroes: [
      { id: 'h1', name: 'Mira' },
      { id: 'h2', name: 'Bram' },
      { id: 'h3', name: 'Sela' },
    ],
  };
  channels.gold.value = { gold: 12 };
  channels.journal.value = { entries: [] };
  channels.calendar.value = { day: 7, time: 'evening' };
});

const open = async (user) => {
  await user.click(screen.getByRole('button', { name: 'Split loot…' }));
};

describe('splitEvenly', () => {
  it('divides total by share count with floor', () => {
    expect(splitEvenly(30, 3)).toEqual({ each: 10, remainder: 0 });
    expect(splitEvenly(31, 3)).toEqual({ each: 10, remainder: 1 });
    expect(splitEvenly(7, 4)).toEqual({ each: 1, remainder: 3 });
  });

  it('returns the whole total as remainder when share count is zero', () => {
    expect(splitEvenly(42, 0)).toEqual({ each: 0, remainder: 42 });
  });

  it('floors and clamps non-numeric inputs to zero', () => {
    expect(splitEvenly('-5', 3)).toEqual({ each: 0, remainder: 0 });
    expect(splitEvenly('abc', 3)).toEqual({ each: 0, remainder: 0 });
    expect(splitEvenly(10.7, 3)).toEqual({ each: 3, remainder: 1 });
  });
});

describe('LootSplitter', () => {
  it('opens a modal with one checkbox per named hero', async () => {
    const user = userEvent.setup();
    render(<LootSplitter />);
    await open(user);
    expect(screen.getByRole('dialog', { name: 'Split loot' })).toBeInTheDocument();
    expect(screen.getByLabelText('Mira')).toBeChecked();
    expect(screen.getByLabelText('Bram')).toBeChecked();
    expect(screen.getByLabelText('Sela')).toBeChecked();
  });

  it('previews each-share and remainder as the total changes', async () => {
    const user = userEvent.setup();
    render(<LootSplitter />);
    await open(user);

    fireEvent.change(screen.getByLabelText('Total gold found'), {
      target: { value: '31' },
    });
    // 31 / 3 = 10 each, 1 remainder.
    expect(screen.getByText('10', { selector: 'span.previewValue, span' })).toBeInTheDocument();
    // Two preview lines; the remainder block shows "1".
    expect(screen.getAllByText(/^1$/).length).toBeGreaterThan(0);
  });

  it('excluding a hero recalculates the preview', async () => {
    const user = userEvent.setup();
    render(<LootSplitter />);
    await open(user);

    fireEvent.change(screen.getByLabelText('Total gold found'), {
      target: { value: '20' },
    });
    await user.click(screen.getByLabelText('Bram')); // exclude
    // 20 / 2 = 10 each, 0 remainder
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('distributing adds the total to gold and writes a journal entry', async () => {
    const user = userEvent.setup();
    render(<LootSplitter />);
    await open(user);

    fireEvent.change(screen.getByLabelText('Total gold found'), {
      target: { value: '31' },
    });
    await user.click(screen.getByRole('button', { name: /Distribute/ }));

    // 12 + 31 = 43. (The mock stores whatever the component passed to save,
    // skipping the channel's toServer wrap.)
    expect(channels.gold.value).toBe(43);
    const entry = channels.journal.value[0];
    expect(entry.text).toBe(
      'Split 31 gold: 10 each to Mira, Bram and Sela; 1 left to the party kitty.'
    );
    expect(entry.day).toBe(7);
    expect(entry.time).toBe('evening');
    expect(entry.author).toBe('Loot splitter');
  });

  it('disables Distribute when total is zero or no one is included', async () => {
    const user = userEvent.setup();
    render(<LootSplitter />);
    await open(user);

    expect(screen.getByRole('button', { name: /Distribute/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Total gold found'), {
      target: { value: '20' },
    });
    expect(screen.getByRole('button', { name: /Distribute/ })).toBeEnabled();

    // Exclude everyone — disabled again.
    await user.click(screen.getByLabelText('Mira'));
    await user.click(screen.getByLabelText('Bram'));
    await user.click(screen.getByLabelText('Sela'));
    expect(screen.getByRole('button', { name: /Distribute/ })).toBeDisabled();
  });

  it('falls back to a singular sentence when only one hero shares', async () => {
    const user = userEvent.setup();
    render(<LootSplitter />);
    await open(user);

    fireEvent.change(screen.getByLabelText('Total gold found'), {
      target: { value: '10' },
    });
    await user.click(screen.getByLabelText('Bram'));
    await user.click(screen.getByLabelText('Sela'));
    await user.click(screen.getByRole('button', { name: /Distribute/ }));

    expect(channels.journal.value[0].text).toBe('Split 10 gold: 10 each to Mira.');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<LootSplitter />);
    await open(user);
    expect(screen.getByRole('dialog', { name: 'Split loot' })).toBeInTheDocument();
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.queryByRole('dialog', { name: 'Split loot' })).toBeNull();
  });
});
