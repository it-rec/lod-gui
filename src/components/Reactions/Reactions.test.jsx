import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Reactions, { REACTIONS } from './Reactions';

const flyers = () =>
  Array.from(screen.getByTestId('reaction-field').querySelectorAll('[data-testid="reaction-flyer"]'));

const socketListeners = new Map();
const emitted = [];
const fakeSocket = {
  on: (event, handler) => {
    if (!socketListeners.has(event)) socketListeners.set(event, new Set());
    socketListeners.get(event).add(handler);
  },
  off: (event, handler) => {
    socketListeners.get(event)?.delete(handler);
  },
  emit: (event, payload) => emitted.push([event, payload]),
  disconnect: () => {},
  id: 'test-socket',
};

vi.mock('socket.io-client', () => ({ io: () => fakeSocket }));

beforeEach(() => {
  socketListeners.clear();
  emitted.length = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

const dispatch = (event, payload) => {
  socketListeners.get(event)?.forEach((handler) => handler(payload));
};

describe('Reactions', () => {
  it('renders one picker button per reaction', () => {
    render(<Reactions />);
    for (const r of REACTIONS) {
      expect(screen.getByRole('button', { name: r.label })).toBeInTheDocument();
    }
  });

  it('spawns a flying emoji and broadcasts on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Reactions />);

    await user.click(screen.getByRole('button', { name: 'Applause' }));

    expect(flyers()).toHaveLength(1);
    expect(flyers()[0]).toHaveTextContent('👏');
    const broadcasts = emitted.filter(([event]) => event === 'reaction:send');
    expect(broadcasts).toEqual([['reaction:send', { emoji: '👏' }]]);
  });

  it('renders reactions received from other clients', () => {
    render(<Reactions />);
    act(() => {
      dispatch('reaction:send', {
        emoji: '🎯',
        origin: 'peer-socket',
        sentAt: '2026-01-01T00:00:00.000Z',
      });
    });
    expect(flyers()).toHaveLength(1);
    expect(flyers()[0]).toHaveTextContent('🎯');
  });

  it('skips its own echo so the local emoji is not duplicated', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Reactions />);
    await user.click(screen.getByRole('button', { name: 'Cheers' }));

    expect(flyers()).toHaveLength(1);
    act(() => {
      dispatch('reaction:send', { emoji: '🍻', origin: 'test-socket' });
    });
    expect(flyers()).toHaveLength(1);
  });

  it('removes the flying emoji after the animation window', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Reactions />);
    await user.click(screen.getByRole('button', { name: 'Critical hit' }));
    expect(flyers()).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(flyers()).toHaveLength(0);
  });
});
