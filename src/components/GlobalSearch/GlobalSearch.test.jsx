import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlobalSearch from './GlobalSearch';

// Stub the network util so the index builds from a known fixture.
vi.mock('../../utils/networkUtils', () => ({
  get: vi.fn(async (path) => {
    if (path.endsWith('/quests/'))
      return {
        quests: [
          { id: 'q1', title: 'Find the Lost Crown', notes: 'See Lord Vrass', isDone: false },
        ],
      };
    if (path.endsWith('/npcs/'))
      return {
        npcs: [
          { id: 'p1', name: 'Sir Talbot', role: 'ally', location: 'The Wounded Boar', notes: '' },
        ],
      };
    if (path.endsWith('/locations/'))
      return {
        locations: [
          { id: 'l1', name: 'Dragonholt', region: 'Terrinoth', status: 'home', notes: '' },
        ],
      };
    if (path.endsWith('/keywords/'))
      return { keywords: [{ id: 'k1', text: 'silvermoon' }] };
    if (path.endsWith('/journal/'))
      return {
        entries: [
          {
            id: 'j1',
            day: 2,
            time: 'evening',
            text: 'Met the masked stranger',
            createdAt: '2025-01-01T00:00:00Z',
          },
        ],
      };
    return null;
  }),
  post: vi.fn(),
}));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const openWithHotkey = async (user) => {
  await user.keyboard('{Control>}k{/Control}');
};

describe('GlobalSearch', () => {
  it('opens with Ctrl+K and focuses the input', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openWithHotkey(user);

    const input = await screen.findByLabelText('Search the campaign');
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('closes with Escape', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);
    await openWithHotkey(user);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('returns matches across multiple categories', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);
    await openWithHotkey(user);
    await screen.findByRole('dialog');

    // Type into the input. waitFor handles the async index build.
    await user.type(
      screen.getByLabelText('Search the campaign'),
      'r'
    );

    // Multiple categories: quest "Crown", person "Sir Talbot", location "Dragonholt".
    await waitFor(() => {
      expect(screen.getByText('Find the Lost Crown')).toBeInTheDocument();
      expect(screen.getByText('Sir Talbot')).toBeInTheDocument();
      expect(screen.getByText('Dragonholt')).toBeInTheDocument();
    });
  });

  it('dispatches a reveal event on Enter and closes', async () => {
    const user = userEvent.setup();
    const reveal = vi.fn();
    window.addEventListener('lod:reveal', reveal);

    render(<GlobalSearch />);
    await openWithHotkey(user);
    await screen.findByRole('dialog');

    await user.type(
      screen.getByLabelText('Search the campaign'),
      'crown'
    );

    await waitFor(() => {
      expect(screen.getByText('Find the Lost Crown')).toBeInTheDocument();
    });

    await user.keyboard('{Enter}');

    expect(reveal).toHaveBeenCalledTimes(1);
    expect(reveal.mock.calls[0][0].detail).toMatchObject({ panel: 'quests' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    window.removeEventListener('lod:reveal', reveal);
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);
    await openWithHotkey(user);
    await screen.findByRole('dialog');

    await user.type(
      screen.getByLabelText('Search the campaign'),
      'griffin'
    );

    await waitFor(() => {
      expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
    });
  });
});
