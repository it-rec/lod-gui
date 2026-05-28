import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionRecap from './SessionRecap';

const channels = {
  calendar: { day: 7, time: 'evening', adventure: 'A Quiet Errand' },
  gold: 42,
  fame: 3,
  heroes: { heroes: [{ id: 'h1', name: 'Mira' }, { id: 'h2', name: 'Bram' }] },
  quests: { quests: [{ id: 'q1', title: 'Find heir', isDone: false }] },
  npcs: { npcs: [{ id: 'n1', name: 'Edda', role: 'ally' }] },
  locations: { locations: [{ id: 'l1', name: 'Greycross', status: 'home' }] },
  journal: {
    entries: [
      { id: 'j1', day: 7, time: 'evening', text: 'Met Edda at the well.' },
    ],
  },
};

vi.mock('../../hooks/useGameChannel', () => ({
  useGameChannel: ({ channel, fromServer, initial }) => ({
    value: fromServer ? fromServer(rawFor(channel)) : (rawFor(channel) ?? initial),
    save: vi.fn(),
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('../../shared', () => ({
  collections: {
    CALENDAR: 'calendar',
    GOLD: 'gold',
    FAME: 'fame',
    HEROES: 'heroes',
    QUESTS: 'quests',
    NPCS: 'npcs',
    LOCATIONS: 'locations',
    JOURNAL: 'journal',
  },
}));

const rawFor = (channel) => {
  switch (channel) {
  case 'gold': return { gold: channels.gold };
  case 'fame': return { fame: channels.fame };
  default: return channels[channel];
  }
};

beforeEach(() => {
  channels.calendar = { day: 7, time: 'evening', adventure: 'A Quiet Errand' };
  channels.gold = 42;
  channels.fame = 3;
});

describe('SessionRecap', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<SessionRecap open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the adventure title, day/time and party when open', () => {
    render(<SessionRecap open={true} onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Session recap' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A Quiet Errand' })).toBeInTheDocument();
    // The "Day 7 · Evening" string appears both in the header subtitle and in
    // the journal stamp — assert at least one match.
    expect(screen.getAllByText(/Day 7.*Evening/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Mira, Bram/)).toBeInTheDocument();
  });

  it('renders stat cards including gold, fame and the recent journal block', () => {
    render(<SessionRecap open={true} onClose={() => {}} />);
    // 42 gold and 3 fame are unique numbers in the recap.
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Met Edda at the well.')).toBeInTheDocument();
  });

  it('Escape calls onClose', () => {
    const onClose = vi.fn();
    render(<SessionRecap open={true} onClose={onClose} />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('copies a plain-text recap to the clipboard', async () => {
    // jsdom may install a non-configurable navigator.clipboard whose
    // descriptor blocks both reassignment and spying. Skip that branch and
    // stub the property directly via the global.
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', new Proxy(window.navigator, {
      get(target, prop) {
        if (prop === 'clipboard') return { writeText };
        return Reflect.get(target, prop);
      },
    }));

    const user = userEvent.setup();
    render(<SessionRecap open={true} onClose={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Copy as text/ }));

    expect(writeText).toHaveBeenCalledTimes(1);
    const text = writeText.mock.calls[0][0];
    expect(text).toContain('# A Quiet Errand');
    expect(text).toContain('Day 7, Evening');
    expect(text).toContain('Gold: 42');

    vi.unstubAllGlobals();
  });
});
