import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Soundscape from './Soundscape';

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
  id: 'test-socket',
};

vi.mock('socket.io-client', () => ({ io: () => fakeSocket }));

// Capture which scenes the player was asked to play.
const playerCalls = [];
vi.mock('../../utils/soundscape', async () => {
  const actual = await vi.importActual('../../utils/soundscape');
  return {
    ...actual,
    createSoundscapePlayer: () => ({
      setScene: (id) => playerCalls.push(['setScene', id]),
      setVolume: (v) => playerCalls.push(['setVolume', v]),
      stop: () => playerCalls.push(['stop']),
      currentScene: () => 'silence',
    }),
  };
});

beforeEach(() => {
  socketListeners.clear();
  emitted.length = 0;
  playerCalls.length = 0;
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const open = async (user) =>
  user.click(screen.getByRole('button', { name: 'Ambient soundscape' }));

describe('Soundscape', () => {
  it('opens a popover with one radio per scene', async () => {
    const user = userEvent.setup();
    render(<Soundscape />);
    await open(user);

    expect(screen.getByRole('dialog', { name: 'Ambient soundscape' })).toBeInTheDocument();
    for (const label of ['Silence', 'Tavern', 'Forest', 'Dungeon', 'Storm', 'Sea']) {
      expect(screen.getByRole('radio', { name: label })).toBeInTheDocument();
    }
  });

  it('selecting a scene calls the player and emits over the socket', async () => {
    const user = userEvent.setup();
    render(<Soundscape />);
    await open(user);

    await user.click(screen.getByRole('radio', { name: 'Forest' }));

    expect(playerCalls.some(([m, v]) => m === 'setScene' && v === 'forest')).toBe(true);
    const broadcasts = emitted.filter(([event]) => event === 'soundscape:set');
    expect(broadcasts).toEqual([['soundscape:set', { scene: 'forest' }]]);
    expect(screen.getByRole('radio', { name: 'Forest' })).toHaveAttribute('aria-checked', 'true');
  });

  it('applies a scene received from another client', async () => {
    const user = userEvent.setup();
    render(<Soundscape />);
    await open(user);
    // The hook only spins the player up after a user interaction, so click
    // Silence first to ensure a player exists before the peer event lands.
    await user.click(screen.getByRole('radio', { name: 'Silence' }));

    act(() => {
      socketListeners
        .get('soundscape:set')
        ?.forEach((handler) => handler({ scene: 'storm', origin: 'peer' }));
    });

    expect(screen.getByRole('radio', { name: 'Storm' })).toHaveAttribute('aria-checked', 'true');
    expect(playerCalls.some(([m, v]) => m === 'setScene' && v === 'storm')).toBe(true);
  });

  it('ignores its own echo from the socket', async () => {
    const user = userEvent.setup();
    render(<Soundscape />);
    await open(user);
    await user.click(screen.getByRole('radio', { name: 'Tavern' }));
    playerCalls.length = 0;

    act(() => {
      socketListeners
        .get('soundscape:set')
        ?.forEach((handler) => handler({ scene: 'tavern', origin: 'test-socket' }));
    });

    // No further setScene call from the echo.
    expect(playerCalls.find(([m, v]) => m === 'setScene' && v === 'tavern')).toBeUndefined();
  });

  it('persists volume and mute per device', async () => {
    const user = userEvent.setup();
    render(<Soundscape />);
    await open(user);
    // Tavern so a player exists.
    await user.click(screen.getByRole('radio', { name: 'Tavern' }));

    const slider = screen.getByLabelText('Soundscape volume');
    // change events are synchronous and avoid the slider's keystroke quirks.
    slider.focus();
    // Use fireEvent via userEvent.
    await user.click(screen.getByRole('button', { name: 'Mute' }));

    expect(window.localStorage.getItem('lod:pref:soundscape-muted')).toBe('true');
    // Mute toggles the player to volume 0.
    expect(playerCalls.some(([m, v]) => m === 'setVolume' && v === 0)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Unmute' }));
    expect(window.localStorage.getItem('lod:pref:soundscape-muted')).toBe('false');
  });
});
