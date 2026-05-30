import { useEffect } from 'react';
import { useGameChannel } from './useGameChannel';
import { collections, gamePath } from '../shared';

const PHASES = new Set(['morning', 'afternoon', 'evening', 'night']);

// Mirrors the Calendar's `time` field onto <html data-time-of-day>, so the
// stylesheet can overlay a per-phase tint without any component knowing
// about colours.
export const useTimeOfDayTheme = () => {
  const { value } = useGameChannel({
    channel: collections.CALENDAR,
    path: gamePath('calendar'),
    initial: { time: 'morning' },
    fromServer: (raw) => ({
      time: PHASES.has(raw?.time) ? raw.time : 'morning',
    }),
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-time-of-day', value.time);
  }, [value.time]);
};
