import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

const Dialog = ({ onClose, autoFocus }) => {
  const ref = useFocusTrap(true, { autoFocus });
  return (
    <div ref={ref} tabIndex={-1} role="dialog">
      <button type="button">first</button>
      <button type="button">middle</button>
      <button type="button" onClick={onClose}>
        last
      </button>
    </div>
  );
};

const Harness = ({ autoFocus }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        opener
      </button>
      {open && <Dialog autoFocus={autoFocus} onClose={() => setOpen(false)} />}
    </>
  );
};

afterEach(cleanup);

describe('useFocusTrap', () => {
  it('focuses the first focusable element when opened', () => {
    render(<Dialog onClose={() => {}} />);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'first' })
    );
  });

  it('does not steal focus when autoFocus is false', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    render(<Dialog onClose={() => {}} autoFocus={false} />);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('wraps focus from the last element back to the first on Tab', () => {
    render(<Dialog onClose={() => {}} />);
    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'last' });
    last.focus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('wraps focus from the first element to the last on Shift+Tab', () => {
    render(<Dialog onClose={() => {}} />);
    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'last' });
    first.focus();
    fireEvent.keyDown(screen.getByRole('dialog'), {
      key: 'Tab',
      shiftKey: true,
    });
    expect(document.activeElement).toBe(last);
  });

  it('restores focus to the opener when the dialog closes', () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'opener' });
    opener.focus();
    fireEvent.click(opener);
    // Trap moved focus into the dialog.
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'first' })
    );
    // Closing from inside the dialog returns focus to the opener.
    fireEvent.click(screen.getByRole('button', { name: 'last' }));
    expect(document.activeElement).toBe(opener);
  });
});
