import { io } from 'socket.io-client';

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

export const getSocket = () => {
  if (!socket) {
    socket = io({ reconnectionDelayMax: 8000 });
    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('disconnected'));
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
