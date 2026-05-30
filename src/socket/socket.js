import { io } from 'socket.io-client';
import { GAME_ID } from '../shared';

// A single shared Socket.IO connection for the whole app. The original code
// opened a separate socket in every component (Heroes, Gold, Fame,
// StoryPoints), which meant four connections and a stale-closure cleanup bug.
let socket;

const statusListeners = new Set();
let status = 'connecting';

const setStatus = (next) => {
  if (next === status) return;
  status = next;
  statusListeners.forEach((listener) => listener(status));
};

const presenceListeners = new Set();
let presence = 0;

const setPresence = (next) => {
  const value = Number.isFinite(next) ? Math.max(0, Math.round(next)) : 0;
  if (value === presence) return;
  presence = value;
  presenceListeners.forEach((listener) => listener(presence));
};

export const getSocket = () => {
  if (!socket) {
    socket = io({ reconnectionDelayMax: 8000 });
    socket.on('connect', () => {
      setStatus('connected');
      // Join this game's room so we only receive its updates. Re-sent on
      // every (re)connect because room membership lives on the server socket.
      socket.emit('game:join', GAME_ID);
    });
    socket.on('disconnect', () => {
      setStatus('disconnected');
      setPresence(0);
    });
    socket.on('connect_error', () => setStatus('disconnected'));
    socket.on('presence', (payload) => setPresence(payload?.players));
  }
  return socket;
};

// Id of this browser tab's connection. Sent with every POST so the server can
// tell us which client a broadcast came from and we can skip our own echo.
export const getClientId = () => getSocket().id || null;

export const getConnectionStatus = () => status;

export const subscribeConnectionStatus = (listener) => {
  getSocket();
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
};

export const getPresence = () => presence;

export const subscribePresence = (listener) => {
  getSocket();
  presenceListeners.add(listener);
  return () => presenceListeners.delete(listener);
};
