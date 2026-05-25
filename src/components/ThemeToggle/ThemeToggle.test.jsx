import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';

// jsdom does not implement matchMedia; the hook falls back to it for
// prefers-color-scheme detection, so we stub it on every test.
const stubMatchMedia = (matches) => {
  window.matchMedia = (query) => ({
    matches: typeof matches === 'function' ? matches(query) : matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
};

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  stubMatchMedia(false);
});

describe('ThemeToggle', () => {
  it('defaults to the parchment (light) theme and offers a switch to dark', () => {
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(
      screen.getByRole('button', { name: /Switch to candlelight theme/ })
    ).toBeInTheDocument();
  });

  it('toggles the data-theme attribute on the html element', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(
      screen.getByRole('button', { name: /Switch to parchment theme/ })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists the chosen theme across remounts', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ThemeToggle />);
    await user.click(screen.getByRole('button'));
    unmount();
    document.documentElement.removeAttribute('data-theme');

    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('honours the OS preference when none has been chosen', () => {
    stubMatchMedia((query) => query.includes('dark'));
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
