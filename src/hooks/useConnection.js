import { useSyncExternalStore } from 'react';
import {
  subscribeConnectionStatus,
  getConnectionStatus,
} from '../socket/socket';

// Live Socket.IO connection status: 'connecting' | 'connected' | 'disconnected'.
export const useConnection = () =>
  useSyncExternalStore(
    subscribeConnectionStatus,
    getConnectionStatus,
    getConnectionStatus
  );
