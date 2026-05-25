const CACHE_PREFIX = 'lod:cache:';
const PREF_PREFIX = 'lod:pref:';

// Optimistic client-side cache. Reading a channel from localStorage lets a
// panel paint last-known data instantly on load, before the server responds —
// and keeps something on screen when the backend is unreachable.
export const cacheGet = (key) => {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const cacheSet = (key, value) => {
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — caching is best-effort */
  }
};

// Per-device UI preferences (e.g. which panels the player keeps collapsed).
// Distinct from the data cache so a backup restore can't wipe it.
export const prefGet = (key) => {
  try {
    const raw = window.localStorage.getItem(PREF_PREFIX + key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const prefSet = (key, value) => {
  try {
    window.localStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
  } catch {
    /* best-effort */
  }
};

export const prefRemove = (key) => {
  try {
    window.localStorage.removeItem(PREF_PREFIX + key);
  } catch {
    /* best-effort */
  }
};
