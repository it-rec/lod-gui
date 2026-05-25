import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Inventory from './Inventory';

vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ initial }) => {
      const [value, setValue] = useState(initial);
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

beforeEach(() => {
  window.localStorage.clear();
});

const expand = async (user) => {
  await user.click(screen.getByRole('button', { name: /Show Treasure/ }));
};

describe('Inventory', () => {
  it('stows an item, adjusts quantity, and discards it', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await expand(user);

    expect(screen.getByText(/No spoils yet/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('New item name'), 'Silver ring');
    await user.type(screen.getByLabelText('Item quantity'), '3');
    await user.click(screen.getByRole('button', { name: 'Stow' }));

    expect(screen.getByText('Silver ring')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Add 1 to Silver ring'));
    expect(screen.getByText('4')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Take 1 from Silver ring'));
    await user.click(screen.getByLabelText('Take 1 from Silver ring'));
    expect(screen.getByText('2')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Discard Silver ring'));
    expect(screen.queryByText('Silver ring')).not.toBeInTheDocument();
  });

  it('removes an item entirely when its quantity reaches zero via the - button', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await expand(user);

    await user.type(screen.getByLabelText('New item name'), 'Torch');
    await user.click(screen.getByRole('button', { name: 'Stow' }));
    expect(screen.getByText('Torch')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Take 1 from Torch'));
    expect(screen.queryByText('Torch')).not.toBeInTheDocument();
  });

  it('edits an item with a carrier and notes', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await expand(user);

    await user.type(screen.getByLabelText('New item name'), 'Wand of light');
    await user.click(screen.getByRole('button', { name: 'Stow' }));

    await user.click(screen.getByLabelText('Edit Wand of light'));
    await user.type(screen.getByLabelText('Carried by'), 'Cleric Brom');
    await user.type(screen.getByLabelText('Item notes'), 'Charged: 3 uses left.');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Cleric Brom')).toBeInTheDocument();
    expect(screen.getByText('Charged: 3 uses left.')).toBeInTheDocument();
  });
});
