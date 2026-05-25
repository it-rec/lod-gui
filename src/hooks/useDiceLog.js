import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket, getClientId } from '../socket/socket';
import { prefGet, prefSet } from '../utils/localStorageUtil';
import { rollExpression } from '../utils/dice';
import { usePlayerName } from './usePlayerName';

const LOG_PREF_KEY = 'dice-log';
const MAX_ENTRIES = 20;

const sanitizeEntry = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.expression !== 'string') return null;
  if (!Array.isArray(raw.groups)) return null;
  return {
    id:
      typeof raw.id === 'string' && raw.id.length > 0
        ? raw.id
        : `roll-${Math.random().toString(36).slice(2, 10)}`,
    expression: raw.expression,
    groups: raw.groups,
    modifier: Number.isFinite(raw.modifier) ? raw.modifier : 0,
    total: Number.isFinite(raw.total) ? raw.total : 0,
    by: typeof raw.by === 'string' ? raw.by : '',
    rolledAt: typeof raw.rolledAt === 'string' ? raw.rolledAt : new Date().toISOString(),
    origin: typeof raw.origin === 'string' ? raw.origin : null,
    own: Boolean(raw.own),
  };
};

const loadLog = () => {
  const stored = prefGet(LOG_PREF_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.map(sanitizeEntry).filter(Boolean).slice(0, MAX_ENTRIES);
};

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `roll-${Math.random().toString(36).slice(2, 10)}`;

// Owns the shared roll history. Each entry is created locally on `roll(...)`,
// broadcast via Socket.IO, and any rolls received from peers are appended too.
// The local list is persisted to localStorage as a UI preference so a refresh
// keeps the recent log.
export const useDiceLog = () => {
  const [entries, setEntries] = useState(() => loadLog());
  // Roller name is shared across the app via usePlayerName so the same name
  // attributes dice rolls, journal entries, etc. for the current device.
  const { name: rollerName, setName: setRollerName } = usePlayerName();

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const writeLog = useCallback((next) => {
    const trimmed = next.slice(0, MAX_ENTRIES);
    setEntries(trimmed);
    prefSet(LOG_PREF_KEY, trimmed);
  }, []);

  // Listen for rolls from other clients.
  useEffect(() => {
    const socket = getSocket();
    const handler = (raw) => {
      const entry = sanitizeEntry(raw);
      if (!entry) return;
      // Skip our own echo — we already added the local entry optimistically.
      if (entry.origin && entry.origin === getClientId()) return;
      const next = [{ ...entry, own: false }, ...entriesRef.current].slice(
        0,
        MAX_ENTRIES
      );
      writeLog(next);
    };
    socket.on('dice:roll', handler);
    return () => socket.off('dice:roll', handler);
  }, [writeLog]);

  // Roll an expression. Returns the new entry, or `{ error }` if the
  // expression didn't parse — the caller decides how to surface that.
  const roll = useCallback(
    (expression) => {
      const result = rollExpression(expression);
      if (result.error) return { error: result.error };
      const entry = {
        id: newId(),
        expression: result.expression,
        groups: result.groups,
        modifier: result.modifier,
        total: result.total,
        by: rollerName.trim(),
        rolledAt: new Date().toISOString(),
        origin: getClientId(),
        own: true,
      };
      writeLog([entry, ...entriesRef.current]);
      const socket = getSocket();
      // Peers see the same record minus the local-only `own` flag.
      socket.emit('dice:roll', {
        id: entry.id,
        expression: entry.expression,
        groups: entry.groups,
        modifier: entry.modifier,
        total: entry.total,
        by: entry.by,
        rolledAt: entry.rolledAt,
        origin: entry.origin,
      });
      return { entry };
    },
    [rollerName, writeLog]
  );

  const clear = useCallback(() => writeLog([]), [writeLog]);

  return { entries, roll, clear, rollerName, setRollerName };
};
