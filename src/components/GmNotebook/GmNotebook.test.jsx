import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GmNotebook from './GmNotebook';

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

const open = async (user) => {
  await user.click(screen.getByRole('button', { name: 'GM notebook (private)' }));
};

describe('GmNotebook', () => {
  it('opens a private notebook popover with the placeholder', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<GmNotebook />);
    await open(user);

    expect(screen.getByRole('dialog', { name: 'GM notebook' })).toBeInTheDocument();
    expect(
      screen.getByText(/Private to this device — never broadcast\./)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Hidden NPCs, secret rolls/)).toBeInTheDocument();
  });

  it('persists notes to localStorage after the debounce', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<GmNotebook />);
    await open(user);

    const textarea = screen.getByLabelText('GM notes');
    await user.type(textarea, 'The duke is the killer');
    // Wait past the debounce window (400ms).
    await new Promise((r) => setTimeout(r, 600));

    expect(window.localStorage.getItem('lod:pref:gm-notebook')).toBe(
      JSON.stringify('The duke is the killer')
    );
  });

  it('rehydrates notes from localStorage on mount', async () => {
    window.localStorage.setItem(
      'lod:pref:gm-notebook',
      JSON.stringify('Beware the dragon')
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<GmNotebook />);
    await open(user);

    expect(screen.getByLabelText('GM notes')).toHaveValue('Beware the dragon');
  });

  it('shows a word-count badge on the trigger when notes exist', async () => {
    window.localStorage.setItem(
      'lod:pref:gm-notebook',
      JSON.stringify('three words here')
    );
    render(<GmNotebook />);
    const trigger = screen.getByRole('button', { name: 'GM notebook (private)' });
    expect(trigger).toHaveTextContent('3');
  });

  it('closes the popover on Escape', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<GmNotebook />);
    await open(user);
    expect(screen.getByRole('dialog', { name: 'GM notebook' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'GM notebook' })).toBeNull();
  });
});
