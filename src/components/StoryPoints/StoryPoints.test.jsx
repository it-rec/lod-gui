import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoryPoints from './StoryPoints';

vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ initial }) => {
      const [value, setValue] = useState(initial);
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

describe('StoryPoints', () => {
  it('records an entry and updates the progress', async () => {
    const user = userEvent.setup();
    render(<StoryPoints />);

    expect(screen.getByText('0 of 208 entries recorded')).toBeInTheDocument();

    const entry = screen.getByRole('button', { name: 'Entry A1' });
    expect(entry).toHaveAttribute('aria-pressed', 'false');

    await user.click(entry);
    expect(entry).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 of 208 entries recorded')).toBeInTheDocument();
  });

  it('filters the grid down to completed entries', async () => {
    const user = userEvent.setup();
    render(<StoryPoints />);

    await user.click(screen.getByRole('button', { name: 'Entry A1' }));
    await user.click(screen.getByRole('button', { name: 'Completed' }));

    expect(
      screen.getByRole('button', { name: 'Entry A1, recorded' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Entry A2' })
    ).not.toBeInTheDocument();
  });
});
