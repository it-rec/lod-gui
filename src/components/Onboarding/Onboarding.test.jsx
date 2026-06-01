import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import Onboarding, { openOnboarding } from './Onboarding';
import { prefRemove, prefGet } from '../../utils/localStorageUtil';

const SEEN_KEY = 'onboarding-seen:1';

beforeEach(() => {
  prefRemove(SEEN_KEY);
});
afterEach(cleanup);

describe('Onboarding', () => {
  it('greets the player on a fresh device', () => {
    render(<Onboarding />);
    expect(
      screen.getByRole('dialog', { name: 'Your Campaign Companion' })
    ).toBeInTheDocument();
  });

  it('dismisses and remembers it was seen', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter the tome' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(prefGet(SEEN_KEY)).toBe(true);
  });

  it('stays hidden on a device that has already seen it', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter the tome' }));
    cleanup();

    render(<Onboarding />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('can be re-opened on demand', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter the tome' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    act(() => {
      openOnboarding();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<Onboarding />);
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
