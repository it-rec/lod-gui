import { useCallback, useEffect, useState } from 'react';
import { prefGet, prefSet } from '../utils/localStorageUtil';

const PREF_KEY = 'dice-macros';
const MAX_MACROS = 12;
const MAX_NAME_LEN = 24;

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `macro-${Math.random().toString(36).slice(2, 10)}`;

const sanitize = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, MAX_NAME_LEN) : '';
  const expression = typeof raw.expression === 'string' ? raw.expression.trim() : '';
  if (!name || !expression) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    name,
    expression,
  };
};

const load = () => {
  const stored = prefGet(PREF_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.map(sanitize).filter(Boolean).slice(0, MAX_MACROS);
};

// Per-device collection of saved dice expressions ("Longsword attack",
// "Sneak", "Heal touch"). Stored under the preference namespace so the
// macros survive across sessions but are device-local — they aren't part
// of the shared campaign state, the campaign backup file, or the
// Socket.IO broadcast. Different devices keep their own.
export const useDiceMacros = () => {
  const [macros, setMacros] = useState(load);

  // Cross-tab sync — if another tab in the same browser edits the list,
  // pick that up so a user with two windows open doesn't see a stale view.
  useEffect(() => {
    const handler = (event) => {
      if (event.key !== `lod:pref:${PREF_KEY}`) return;
      setMacros(load());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Functional updates so successive synchronous calls compose against the
  // latest state instead of the closed-over snapshot from one render ago.
  const update = useCallback((mutator) => {
    setMacros((current) => {
      const next = mutator(current).slice(0, MAX_MACROS);
      prefSet(PREF_KEY, next);
      return next;
    });
  }, []);

  const add = useCallback(
    (name, expression) => {
      const entry = sanitize({ name, expression });
      if (!entry) return null;
      // Names must be unique — re-saving an existing name overwrites it
      // rather than piling up duplicates.
      update((current) => [
        ...current.filter((m) => m.name.toLowerCase() !== entry.name.toLowerCase()),
        entry,
      ]);
      return entry;
    },
    [update]
  );

  const remove = useCallback(
    (id) => {
      update((current) => current.filter((m) => m.id !== id));
    },
    [update]
  );

  return { macros, add, remove };
};
