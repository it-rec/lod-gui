import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameChannel } from './useGameChannel';
import { get, post } from '../utils/networkUtils';

// Fake socket: tests emit into `handlers` to simulate a peer's broadcast.
const handlers = {};
const emitFromPeer = (channel, raw, origin = 'peer') => {
  handlers[channel]?.forEach((fn) => fn(raw, origin));
};

vi.mock('../socket/socket', () => ({
  getSocket: () => ({
    on: (channel, fn) => {
      (handlers[channel] ||= new Set()).add(fn);
    },
    off: (channel, fn) => {
      handlers[channel]?.delete(fn);
    },
  }),
  getClientId: () => 'this-client',
  subscribeConnectionStatus: () => () => {},
  getConnectionStatus: () => 'connected',
}));

vi.mock('../utils/networkUtils', () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

const renderChannel = (channel) =>
  renderHook(() =>
    useGameChannel({ channel, path: `/api/test/${channel}/`, initial: 0 })
  );

describe('useGameChannel realtime updates', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    get.mockResolvedValue(null);
    post.mockResolvedValue({});
  });

  it('applies a peer broadcast while no local edit is pending', async () => {
    const { result } = renderChannel('rt-idle');
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => emitFromPeer('rt-idle', 5));
    expect(result.current.value).toBe(5);
  });

  it('ignores its own echo', async () => {
    const { result } = renderChannel('rt-echo');
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => emitFromPeer('rt-echo', 5, 'this-client'));
    expect(result.current.value).toBe(0);
  });

  it('keeps a pending local edit over a peer broadcast, then accepts peers again once the save settles', async () => {
    const { result } = renderChannel('rt-race');
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Local edit enters the debounce window…
    act(() => result.current.save(10));
    expect(result.current.value).toBe(10);

    // …so a peer snapshot arriving now must not clobber it: our POST is about
    // to overwrite the server anyway, and applying it would desync this
    // screen from what everyone else ends up seeing.
    act(() => emitFromPeer('rt-race', 99));
    expect(result.current.value).toBe(10);

    // Once the debounced POST has fired and resolved, peer broadcasts win
    // again as usual.
    await waitFor(() => expect(post).toHaveBeenCalledWith('/api/test/rt-race/', 10), {
      timeout: 2000,
    });
    await act(() => Promise.resolve());

    act(() => emitFromPeer('rt-race', 7));
    expect(result.current.value).toBe(7);
  });
});
