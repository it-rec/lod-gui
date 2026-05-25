import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionTimer from './SessionTimer';

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2025-05-25T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SessionTimer', () => {
  it('starts paused at 00:00 with the timer label visible in the header', () => {
    render(<SessionTimer />);
    expect(screen.getByRole('button', { name: /Session timer/ })).toHaveTextContent(
      '00:00'
    );
  });

  it('starts, ticks, pauses, and resets', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SessionTimer />);

    // Open the popover.
    await user.click(screen.getByRole('button', { name: /Session timer/ }));
    await user.click(screen.getByRole('button', { name: 'Start' }));

    // Advance 65 seconds; the popover display should read 01:05.
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(screen.getByRole('dialog')).toHaveTextContent('01:05');

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    // Pausing freezes the display.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('dialog')).toHaveTextContent('01:05');

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('00:00');
  });

  it('persists running state across remounts', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const view = render(<SessionTimer />);

    await user.click(screen.getByRole('button', { name: /Session timer/ }));
    await user.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    view.unmount();

    // Half a minute passes off-screen.
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    render(<SessionTimer />);
    expect(screen.getByRole('button', { name: /Session timer/ })).toHaveTextContent(
      '01:00'
    );
  });
});
