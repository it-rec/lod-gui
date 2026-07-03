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

  it('edits a keyword inline', async () => {
    const user = userEvent.setup();
    render(<Keywords />);

    await user.type(screen.getByLabelText('New keyword'), 'Silver key{Enter}');
    await user.click(screen.getByRole('button', { name: 'Edit Silver key' }));

    const editor = screen.getByLabelText('Edit keyword');
    await user.clear(editor);
    await user.type(editor, 'Golden key{Enter}');

    expect(screen.getByText('Golden key')).toBeInTheDocument();
    expect(screen.queryByText('Silver key')).not.toBeInTheDocument();
  });

  it('cancels an inline edit with Escape', async () => {
    const user = userEvent.setup();
    render(<Keywords />);

    await user.type(screen.getByLabelText('New keyword'), 'Silver key{Enter}');
    await user.click(screen.getByRole('button', { name: 'Edit Silver key' }));

    const editor = screen.getByLabelText('Edit keyword');
    await user.clear(editor);
    await user.type(editor, 'scratch that{Escape}');

    expect(screen.getByText('Silver key')).toBeInTheDocument();
    expect(screen.queryByText('scratch that')).not.toBeInTheDocument();
  });

  it('reveals search once enough keywords are recorded and filters by text', async () => {
    const user = userEvent.setup();
    render(<Keywords />);

    const add = screen.getByLabelText('New keyword');
    for (const word of ['Silver key', 'Sapphire ring', 'Old map', 'Sealed letter']) {
      await user.type(add, `${word}{Enter}`);
    }

    const search = screen.getByLabelText('Search keywords');
    await user.type(search, 'sil');
    expect(screen.getByText('Silver key')).toBeInTheDocument();
    expect(screen.queryByText('Sapphire ring')).not.toBeInTheDocument();
    expect(screen.queryByText('Old map')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'nothing');
    expect(screen.getByText(/No keywords match/)).toBeInTheDocument();
  });
});
