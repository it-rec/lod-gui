import { useCallback, useEffect, useState } from 'react';
import { prefGet, prefSet } from '../utils/localStorageUtil';

// The dice roller historically owned this preference under the
// `dice-roller-name` key. We keep reading from that key for backward
// compatibility (so a player who set their name months ago keeps it) and
// mirror writes to it. Other features that want to attribute work to a
// person (journal entries, future hero pick-up, …) can share this hook.
const PREF_KEY = 'dice-roller-name';

const STORAGE_EVENT = 'lod:player-name-changed';

const readStored = () => {
  const raw = prefGet(PREF_KEY);
  return typeof raw === 'string' ? raw : '';
};

// Tiny pub/sub so multiple hook callers in the same tab stay in sync without
// fighting over storage events (which only fire across tabs).
const listeners = new Set();
const notify = (value) => listeners.forEach((listener) => listener(value));

export const usePlayerName = () => {
  const [name, setNameState] = useState(readStored);

  useEffect(() => {
    const onChange = (value) => setNameState(value);
    listeners.add(onChange);
    const onStorage = (event) => {
      if (event.key && event.key.endsWith(PREF_KEY)) {
        setNameState(readStored());
      }
    };
    // Same-tab CustomEvent path needs a named handler so the cleanup can
    // actually remove it; otherwise unmounted instances keep handling
    // updates and shout into stale React state.
    const onCustom = () => setNameState(readStored());
    window.addEventListener('storage', onStorage);
    window.addEventListener(STORAGE_EVENT, onCustom);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STORAGE_EVENT, onCustom);
    };
  }, []);

  const setName = useCallback((value) => {
    const trimmed = typeof value === 'string' ? value : '';
    prefSet(PREF_KEY, trimmed);
    setNameState(trimmed);
    notify(trimmed);
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
  }, []);

  return { name, setName };
};
