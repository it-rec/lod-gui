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

// The named roster for this game's room: [{ id, name }, …]. Distinct from the
// raw head-count above, which is global and nameless.
const rosterListeners = new Set();
let roster = [];

const setRoster = (next) => {
  roster = Array.isArray(next) ? next : [];
  rosterListeners.forEach((listener) => listener(roster));
};

// This tab's chosen player name, mirrored to the server so peers can see who
// is at the table. Held here (not just in React) so it can be re-sent on every
// (re)connect from the socket's own connect handler.
let localName = '';

const sendIdentify = () => {
  if (socket && socket.connected) {
    socket.emit('presence:identify', { gameID: GAME_ID, name: localName });
  }
};

// Announce (or update) this player's name to the room.
export const identifyPlayer = (name) => {
  localName = typeof name === 'string' ? name : '';
  sendIdentify();
};

export const getSocket = () => {
  if (!socket) {
    socket = io({ reconnectionDelayMax: 8000 });
    socket.on('connect', () => {
      setStatus('connected');
      // Join this game's room so we only receive its updates. Re-sent on
      // every (re)connect because room membership lives on the server socket.
      socket.emit('game:join', GAME_ID);
      // Re-announce who we are so the roster repopulates after a reconnect.
      sendIdentify();
    });
    socket.on('disconnect', () => {
      setStatus('disconnected');
      setPresence(0);
      setRoster([]);
    });
    socket.on('connect_error', () => setStatus('disconnected'));
    socket.on('presence', (payload) => setPresence(payload?.players));
    socket.on('presence:roster', (payload) => setRoster(payload?.players));
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

export const getRoster = () => roster;

export const subscribeRoster = (listener) => {
  getSocket();
  rosterListeners.add(listener);
  return () => rosterListeners.delete(listener);
};
