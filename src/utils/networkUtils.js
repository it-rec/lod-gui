import { getClientId } from '../socket/socket';

const jsonHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const clientId = getClientId();
  if (clientId) headers['X-Client-Id'] = clientId;
  return headers;
};

export const get = async (path) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
};

export const post = async (path, payload) => {
  const response = await fetch(path, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: jsonHeaders(),
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Save failed (${response.status})`);
  }
  return response.json();
};
