import { useSyncExternalStore } from 'react';
import {
  subscribeConnectionStatus,
  getConnectionStatus,
  subscribePresence,
  getPresence,
  subscribeRoster,
  getRoster,
} from '../socket/socket';

// Live Socket.IO connection status: 'connecting' | 'connected' | 'disconnected'.
export const useConnection = () =>
  useSyncExternalStore(
    subscribeConnectionStatus,
    getConnectionStatus,
    getConnectionStatus
  );

// Number of clients currently joined to the realtime channel — including
// this one. Zero while the link is down or while presence has not arrived.
export const usePresence = () =>
  useSyncExternalStore(subscribePresence, getPresence, getPresence);

// The named roster for this game's room: [{ id, name }, …]. Empty while the
// link is down or before anyone has announced a name.
export const usePresenceRoster = () =>
  useSyncExternalStore(subscribeRoster, getRoster, getRoster);
