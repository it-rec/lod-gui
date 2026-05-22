import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Keywords from './Keywords';

vi.mock('../../hooks/useGameChannel', async () => {
  const { useState } = await import('react');
  return {
    useGameChannel: ({ initial }) => {
      const [value, setValue] = useState(initial);
      return { value, save: setValue, loading: false, error: null, reload: () => {} };
    },
  };
});

describe('Keywords', () => {
  it('records a keyword and then removes it', async () => {
    const user = userEvent.setup();
    render(<Keywords />);

    expect(screen.getByText(/No keywords yet/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('New keyword'), 'Silver key{Enter}');
    expect(screen.getByText('Silver key')).toBeInTheDocument();
    expect(screen.getByText('1 recorded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Silver key' }));
    expect(screen.queryByText('Silver key')).not.toBeInTheDocument();
    expect(screen.getByText(/No keywords yet/)).toBeInTheDocument();
  });
});
