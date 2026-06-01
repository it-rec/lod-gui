import { useSyncExternalStore } from 'react';
import { subscribePending, getPendingCount } from '../utils/pendingSync';

// Number of channels with edits not yet confirmed by the server (i.e. made
// while offline). Zero when everything is in sync.
export const usePendingCount = () =>
  useSyncExternalStore(subscribePending, getPendingCount, getPendingCount);
