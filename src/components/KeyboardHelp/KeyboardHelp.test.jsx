import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KeyboardHelp, { openKeyboardHelp } from './KeyboardHelp';

describe('KeyboardHelp', () => {
  it('opens on ?, lists the main shortcuts, and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<KeyboardHelp />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.keyboard('?');

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Keyboard shortcuts');
    expect(dialog).toHaveTextContent('Open the campaign finder');
    expect(dialog).toHaveTextContent('Show this shortcut list');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens via the programmatic event', () => {
    render(<KeyboardHelp />);
    act(() => openKeyboardHelp());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not swallow ? while typing in a text input', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="some input" />
        <KeyboardHelp />
      </>
    );
    const input = screen.getByLabelText('some input');
    await user.click(input);
    await user.keyboard('?');
    expect(input).toHaveValue('?');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
