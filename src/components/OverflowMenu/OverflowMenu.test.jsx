import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import OverflowMenu from './OverflowMenu';

afterEach(cleanup);

describe('OverflowMenu', () => {
  it('opens a menu of quick actions', () => {
    render(<OverflowMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const menu = screen.getByRole('menu', { name: 'More actions' });
    expect(menu).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Search the campaign/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Welcome guide/ })
    ).toBeInTheDocument();
  });

  it('reflects open state on the trigger for assistive tech', () => {
    render(<OverflowMenu />);
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('fires the matching open event and closes when an item is chosen', () => {
    const opened = vi.fn();
    window.addEventListener('lod:search:open', opened);
    render(<OverflowMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.click(
      screen.getByRole('menuitem', { name: /Search the campaign/ })
    );
    expect(opened).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
    window.removeEventListener('lod:search:open', opened);
  });

  it('closes on Escape', () => {
    render(<OverflowMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
