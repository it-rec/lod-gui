import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import SectionNav, { activeSectionKey } from './SectionNav';

const tallPage = () => {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: 4000,
    configurable: true,
  });
  window.innerHeight = 800;
};

const shortPage = () => {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: 700,
    configurable: true,
  });
  window.innerHeight = 800;
};

afterEach(cleanup);

describe('activeSectionKey', () => {
  const sections = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];

  it('returns the last section scrolled above the anchor line', () => {
    const tops = { a: -400, b: -50, c: 600 };
    expect(activeSectionKey(sections, (k) => tops[k], 140)).toBe('b');
  });

  it('ignores sections not present on the page', () => {
    const tops = { a: -400, b: null, c: 900 };
    expect(activeSectionKey(sections, (k) => tops[k], 140)).toBe('a');
  });

  it('returns null when nothing has reached the anchor yet', () => {
    expect(activeSectionKey(sections, () => 900, 140)).toBeNull();
  });
});

describe('SectionNav', () => {
  beforeEach(() => {
    tallPage();
  });

  it('stays hidden until the page is tall enough to scroll', () => {
    shortPage();
    render(<SectionNav />);
    expect(
      screen.queryByRole('button', { name: 'Jump to section' })
    ).toBeNull();
  });

  it('appears on a tall page and opens a menu of every section', () => {
    render(<SectionNav />);
    const toggle = screen.getByRole('button', { name: 'Jump to section' });
    fireEvent.click(toggle);
    const menu = screen.getByRole('menu', { name: 'Jump to section' });
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Quests/ })).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /The Chronicle/ })
    ).toBeInTheDocument();
  });

  it('fires a reveal event for the chosen section and closes', () => {
    const reveals = [];
    const handler = (event) => reveals.push(event.detail.panel);
    window.addEventListener('lod:reveal', handler);

    render(<SectionNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Jump to section' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Locations/ }));

    expect(reveals).toEqual(['locations']);
    expect(screen.queryByRole('menu')).toBeNull();
    window.removeEventListener('lod:reveal', handler);
  });

  it('closes the menu on Escape', () => {
    render(<SectionNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Jump to section' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
