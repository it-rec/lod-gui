import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Panel from './Panel';

describe('Panel', () => {
  it('renders its children when there is no error', () => {
    render(
      <Panel title="The Party">
        <p>party content</p>
      </Panel>
    );
    expect(screen.getByText('The Party')).toBeInTheDocument();
    expect(screen.getByText('party content')).toBeInTheDocument();
  });

  it('replaces the children with a retry-able error state', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <Panel title="The Party" error={new Error('archive offline')} onRetry={onRetry}>
        <p>party content</p>
      </Panel>
    );

    expect(screen.queryByText('party content')).not.toBeInTheDocument();
    expect(screen.getByText('archive offline')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('collapses and remembers the state when a key is provided', async () => {
    const user = userEvent.setup();
    window.localStorage.clear();

    const { unmount } = render(
      <Panel title="The Chronicle" collapsibleKey="chronicle">
        <p>scroll content</p>
      </Panel>
    );

    expect(screen.getByText('scroll content')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Hide The Chronicle' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(screen.queryByText('scroll content')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show The Chronicle' })
    ).toHaveAttribute('aria-expanded', 'false');

    // Remount — the collapsed state should be restored from localStorage.
    unmount();
    render(
      <Panel title="The Chronicle" collapsibleKey="chronicle">
        <p>scroll content</p>
      </Panel>
    );
    expect(screen.queryByText('scroll content')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show The Chronicle' })
    ).toBeInTheDocument();
  });
});
