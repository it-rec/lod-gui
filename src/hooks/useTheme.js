import { useCallback, useEffect, useState } from 'react';
import { prefGet, prefSet } from '../utils/localStorageUtil';

const PREF_KEY = 'theme';
const VALID = new Set(['light', 'dark']);

const systemPreference = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const initialTheme = () => {
  const stored = prefGet(PREF_KEY);
  if (typeof stored === 'string' && VALID.has(stored)) return stored;
  return systemPreference();
};

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
};

// Owns the active theme. Setting it updates <html data-theme>, persists the
// choice, and notifies any subscriber via React state. While the player has
// not made a choice, the value tracks `prefers-color-scheme` live.
export const useTheme = () => {
  const [theme, setThemeState] = useState(initialTheme);
  const [explicit, setExplicit] = useState(() => {
    const stored = prefGet(PREF_KEY);
    return typeof stored === 'string' && VALID.has(stored);
  });

  // Sync the DOM whenever the theme changes (including initial mount).
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Track the OS preference until the player picks a theme themselves.
  useEffect(() => {
    if (explicit) return undefined;
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event) => setThemeState(event.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [explicit]);

  const setTheme = useCallback((next) => {
    if (!VALID.has(next)) return;
    setThemeState(next);
    setExplicit(true);
    prefSet(PREF_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
};
