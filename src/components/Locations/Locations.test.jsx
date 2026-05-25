import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Locations from './Locations';

vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ initial }) => {
      const [value, setValue] = useState(initial);
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

describe('Locations', () => {
  it('records, edits, and removes a place', async () => {
    const user = userEvent.setup();
    render(<Locations />);

    expect(screen.getByText(/No places yet/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('New location'), 'Dragonholt{Enter}');
    expect(screen.getByText('Dragonholt')).toBeInTheDocument();
    expect(screen.getByText('1 place')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Edit Dragonholt/ }));
    await user.type(screen.getByLabelText('Region'), 'Terrinoth');
    await user.type(screen.getByLabelText('Place notes'), 'A sleepy village at the forest edge');
    await user.click(screen.getByRole('button', { name: 'Visited' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Terrinoth')).toBeInTheDocument();
    expect(
      screen.getByText('A sleepy village at the forest edge')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Dragonholt — status visited/ })
    ).toBeInTheDocument();
    expect(screen.getByText('1 place · 1 visited')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Remove Dragonholt/ }));
    expect(screen.queryByText('Dragonholt')).not.toBeInTheDocument();
  });

  it('cycles a status with the inline badge', async () => {
    const user = userEvent.setup();
    render(<Locations />);

    await user.type(screen.getByLabelText('New location'), 'Whispering Wood{Enter}');

    const badge = screen.getByRole('button', {
      name: /Whispering Wood — status rumored/,
    });
    await user.click(badge);
    expect(
      screen.getByRole('button', { name: /Whispering Wood — status visited/ })
    ).toBeInTheDocument();
  });

  it('filters by status and shows counts', async () => {
    const user = userEvent.setup();
    render(<Locations />);

    await user.type(screen.getByLabelText('New location'), 'Dragonholt{Enter}');
    await user.type(screen.getByLabelText('New location'), 'Black Tower{Enter}');

    // Mark Dragonholt as visited by cycling once
    await user.click(
      screen.getByRole('button', { name: /Dragonholt — status rumored/ })
    );

    await user.click(screen.getByRole('button', { name: /^Visited/ }));
    expect(screen.getByText('Dragonholt')).toBeInTheDocument();
    expect(screen.queryByText('Black Tower')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Rumored/ }));
    expect(screen.getByText('Black Tower')).toBeInTheDocument();
    expect(screen.queryByText('Dragonholt')).not.toBeInTheDocument();
  });
});
