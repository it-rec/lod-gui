import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import Onboarding, { openOnboarding } from './Onboarding';
import { prefRemove, prefGet } from '../../utils/localStorageUtil';

const SEEN_KEY = 'onboarding-seen:1';

beforeEach(() => {
  prefRemove(SEEN_KEY);
});
afterEach(cleanup);

describe('Onboarding tour', () => {
  it('greets the player on a fresh device, starting at step 1', () => {
    render(<Onboarding />);
    expect(
      screen.getByRole('dialog', { name: 'Your Campaign Companion' })
    ).toBeInTheDocument();
    expect(screen.getByText('Everyone shares one tome')).toBeInTheDocument();
    expect(screen.getByText(/1 of 5/)).toBeInTheDocument();
  });

  it('steps forward and back through the tour', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Find anything fast')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Everyone shares one tome')).toBeInTheDocument();
  });

  it('jumps to a step via its progress dot', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole('tab', { name: /Step 5: Jump around/ }));
    expect(screen.getByText('Jump around')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Enter the tome' })
    ).toBeInTheDocument();
  });

  it('finishes on the last step and remembers it was seen', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole('tab', { name: /Step 5/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter the tome' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(prefGet(SEEN_KEY)).toBe(true);
  });

  it('can be skipped from any step and remembers it was seen', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(prefGet(SEEN_KEY)).toBe(true);
  });

  it('stays hidden once seen, and re-opens at step 1 on demand', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    cleanup();

    render(<Onboarding />);
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => {
      openOnboarding();
    });
    expect(screen.getByText('Everyone shares one tome')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<Onboarding />);
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
