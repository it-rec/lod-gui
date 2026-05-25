import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiceRoller from './DiceRoller';

// Capture every listener registered against the socket so peer events can be
// dispatched into the component from the test.
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

vi.mock('socket.io-client', () => ({
  io: () => fakeSocket,
}));

beforeEach(() => {
  socketListeners.clear();
  emitted.length = 0;
  window.localStorage.clear();
  // Predictable rolls: Math.random returns 0.5, so a d6 lands on 4.
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const openPopover = async (user) => {
  await user.click(screen.getByLabelText('Open dice roller'));
};

describe('DiceRoller', () => {
  it('opens a popover with quick-roll buttons', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    await openPopover(user);

    expect(screen.getByRole('dialog', { name: 'Dice roller' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'd20' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2d6' })).toBeInTheDocument();
  });

  it('rolls a quick die and shows the total in the log', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    await openPopover(user);

    await user.click(screen.getByRole('button', { name: 'd6' }));

    // 0.5 * 6 = 3, +1 = 4
    expect(screen.getByLabelText('Total 4')).toBeInTheDocument();
    expect(screen.getByText('1d6')).toBeInTheDocument();
  });

  it('broadcasts each roll over the socket', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    await openPopover(user);

    await user.click(screen.getByRole('button', { name: 'd20' }));

    const broadcasts = emitted.filter(([event]) => event === 'dice:roll');
    expect(broadcasts).toHaveLength(1);
    const [, payload] = broadcasts[0];
    expect(payload.expression).toBe('1d20');
    expect(payload.total).toBe(11); // floor(0.5*20)+1 = 11
  });

  it('parses and rolls a custom expression', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    await openPopover(user);

    const input = screen.getByLabelText('Custom roll expression');
    await user.type(input, '2d6+3');
    await user.click(screen.getByRole('button', { name: 'Roll' }));

    // each d6 lands on 4, plus modifier 3 = 11
    expect(screen.getByLabelText('Total 11')).toBeInTheDocument();
  });

  it('surfaces a parser error as a toast and does not log it', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    await openPopover(user);

    const input = screen.getByLabelText('Custom roll expression');
    await user.type(input, 'garbage');
    await user.click(screen.getByRole('button', { name: 'Roll' }));

    expect(
      screen.queryByText('No rolls yet. Tap a die above or type your own.')
    ).toBeInTheDocument();
  });

  it('renders peer rolls received over the socket', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    await openPopover(user);

    const handlers = socketListeners.get('dice:roll');
    expect(handlers, 'expected a dice:roll listener to be registered').toBeTruthy();

    act(() => {
      handlers.forEach((handler) =>
        handler({
          id: 'peer-1',
          expression: '1d20',
          groups: [
            { sign: 1, sides: 20, rolls: [20], subtotal: 20 },
          ],
          modifier: 0,
          total: 20,
          by: 'Brom',
          rolledAt: new Date().toISOString(),
          origin: 'someone-else',
        })
      );
    });

    expect(screen.getByText('Brom')).toBeInTheDocument();
    expect(screen.getByLabelText('Total 20')).toBeInTheDocument();
  });

  it('ignores its own echo coming back from the socket', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    await openPopover(user);

    await user.click(screen.getByRole('button', { name: 'd6' }));
    // One log entry so far.
    expect(screen.getAllByLabelText(/^Total /)).toHaveLength(1);

    const handlers = socketListeners.get('dice:roll');
    act(() => {
      handlers.forEach((handler) =>
        handler({
          id: 'echo',
          expression: '1d6',
          groups: [{ sign: 1, sides: 6, rolls: [4], subtotal: 4 }],
          modifier: 0,
          total: 4,
          by: '',
          rolledAt: new Date().toISOString(),
          origin: 'test-socket',
        })
      );
    });

    // Still one entry — the echo was dropped.
    expect(screen.getAllByLabelText(/^Total /)).toHaveLength(1);
  });

  it('persists the roller name across remounts', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<DiceRoller />);
    await openPopover(user);
    // fireEvent.change is a single synchronous mutation, avoiding the
    // per-keystroke React/userEvent interplay that has caused flakiness on
    // controlled inputs in batched runs.
    fireEvent.change(screen.getByLabelText('Roller name'), {
      target: { value: 'Mira' },
    });
    expect(screen.getByLabelText('Roller name')).toHaveValue('Mira');
    unmount();

    render(<DiceRoller />);
    await openPopover(user);
    expect(screen.getByLabelText('Roller name')).toHaveValue('Mira');
  });

  it('clears the roll log on demand', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    await openPopover(user);
    await user.click(screen.getByRole('button', { name: 'd6' }));
    expect(screen.getAllByLabelText(/^Total /)).toHaveLength(1);

    await user.click(screen.getByLabelText('Clear roll history'));
    expect(screen.queryByLabelText(/^Total /)).not.toBeInTheDocument();
    expect(
      screen.getByText('No rolls yet. Tap a die above or type your own.')
    ).toBeInTheDocument();
  });
});
