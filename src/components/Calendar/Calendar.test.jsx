import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calendar from './Calendar';

vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ initial }) => {
      const [value, setValue] = useState(initial);
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

describe('Calendar', () => {
  it('advances the time of day and rolls into the next day', async () => {
    const user = userEvent.setup();
    render(<Calendar />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Morning' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    const advance = screen.getByRole('button', { name: 'Advance time' });
    await user.click(advance);
    expect(screen.getByRole('button', { name: 'Afternoon' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.click(advance);
    await user.click(advance);
    expect(screen.getByRole('button', { name: 'Night' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.click(advance);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Morning' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('steps the day and cannot go below one', async () => {
    const user = userEvent.setup();
    render(<Calendar />);

    expect(screen.getByRole('button', { name: 'Previous day' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next day' }));
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
