import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Heroes from './Heroes';

// Replace the data hook with a self-contained stateful fake so the panel can
// be exercised without a server or socket.
vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ initial }) => {
      const [value, setValue] = useState(initial);
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

describe('Heroes', () => {
  it('seeds a default party of four', () => {
    render(<Heroes />);
    expect(screen.getAllByLabelText('Hero name')).toHaveLength(4);
  });

  it('adds a hero to the party', async () => {
    const user = userEvent.setup();
    render(<Heroes />);

    await user.click(screen.getByRole('button', { name: 'Add hero' }));
    expect(screen.getAllByLabelText('Hero name')).toHaveLength(5);
  });

  it('removes a hero through its card', async () => {
    const user = userEvent.setup();
    render(<Heroes />);

    await user.click(
      screen.getAllByRole('button', { name: 'Open character sheet' })[0]
    );
    await user.click(screen.getByRole('button', { name: 'Remove hero' }));
    expect(screen.getAllByLabelText('Hero name')).toHaveLength(3);
  });

  it('disables the party rest while everyone is at full stamina', () => {
    render(<Heroes />);
    expect(screen.getByRole('button', { name: 'Rest the party' })).toBeDisabled();
  });

  it('enables the party rest after a wound and restores everyone on click', async () => {
    const user = userEvent.setup();
    render(<Heroes />);

    await user.click(
      screen.getAllByRole('button', { name: 'Lose a point of stamina' })[0]
    );
    const rest = screen.getByRole('button', { name: 'Rest the party' });
    expect(rest).toBeEnabled();

    await user.click(rest);
    expect(rest).toBeDisabled();
  });
});
