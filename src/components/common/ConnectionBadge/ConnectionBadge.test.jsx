import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// The badge subscribes to the socket-status store, so a thin module mock keeps
// the test deterministic and lets us drive both status and presence directly.
let statusListener;
let presenceListener;
let status = 'connected';
let presence = 0;

vi.mock('../../../socket/socket', () => ({
  subscribeConnectionStatus: (listener) => {
    statusListener = listener;
    return () => {};
  },
  getConnectionStatus: () => status,
  subscribePresence: (listener) => {
    presenceListener = listener;
    return () => {};
  },
  getPresence: () => presence,
}));

import ConnectionBadge from './ConnectionBadge';
import { markDirty, markClean, __resetPending } from '../../../utils/pendingSync';

const setStatus = (next) => {
  status = next;
  act(() => statusListener?.(next));
};

const setPresence = (next) => {
  presence = next;
  act(() => presenceListener?.(next));
};

beforeEach(() => {
  status = 'connected';
  presence = 0;
  __resetPending();
});

describe('ConnectionBadge', () => {
  it('shows "Live sync" when connected', () => {
    render(<ConnectionBadge />);
    expect(screen.getByText('Live sync')).toBeInTheDocument();
  });

  it('shows the player count once presence arrives', () => {
    render(<ConnectionBadge />);
    expect(screen.queryByLabelText(/player online/)).not.toBeInTheDocument();

    setPresence(1);
    expect(screen.getByLabelText('1 player online')).toHaveTextContent('1');

    setPresence(3);
    expect(screen.getByLabelText('3 players online')).toHaveTextContent('3');
  });

  it('hides the player count while disconnected', () => {
    render(<ConnectionBadge />);
    setPresence(2);
    expect(screen.getByLabelText('2 players online')).toBeInTheDocument();

    setStatus('disconnected');
    expect(screen.queryByLabelText(/player.* online/)).not.toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('shows an unsynced-changes count while edits are pending', () => {
    render(<ConnectionBadge />);
    expect(screen.queryByLabelText(/unsynced/)).not.toBeInTheDocument();

    act(() => markDirty('gold', '/api/gold', { gold: 5 }));
    expect(screen.getByLabelText('1 unsynced change')).toHaveTextContent('1');

    act(() => markDirty('fame', '/api/fame', { fame: 2 }));
    expect(screen.getByLabelText('2 unsynced changes')).toHaveTextContent('2');

    act(() => {
      markClean('gold');
      markClean('fame');
    });
    expect(screen.queryByLabelText(/unsynced/)).not.toBeInTheDocument();
  });
});
