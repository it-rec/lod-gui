import { useSyncExternalStore } from 'react';
import {
  subscribeConnectionStatus,
  getConnectionStatus,
  subscribePresence,
  getPresence,
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
