import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { get, post } from '../utils/networkUtils';
import { getSocket, getClientId } from '../socket/socket';
import { cacheGet, cacheSet } from '../utils/localStorageUtil';
import { toast } from '../components/common/Toast/toastStore';

// One hook to own a single game "channel" (gold, fame, heroes, storyPoints):
//  - hydrates instantly from the localStorage cache,
//  - loads the authoritative value from the server,
//  - applies realtime updates from other clients over Socket.IO,
//  - and persists local edits with a debounced POST.
//
// `fromServer` maps a raw server payload to the value the UI works with;
// `toServer` maps it back to the payload that gets stored and broadcast.
export const useGameChannel = ({
  channel,
  path,
  initial,
  fromServer = (raw) => raw,
  toServer = (value) => value,
}) => {
  // Kept in refs so changing identities (inline functions / array literals at
  // the call site) never re-trigger the load effect.
  const fromServerRef = useRef(fromServer);
  const toServerRef = useRef(toServer);
  const initialRef = useRef(initial);
  fromServerRef.current = fromServer;
  toServerRef.current = toServer;
  initialRef.current = initial;

  const [value, setValue] = useState(() => {
    const cached = cacheGet(channel);
    return cached === undefined ? initial : fromServer(cached);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const valueRef = useRef(value);
  valueRef.current = value;

  // Load the authoritative value from the server (re-runs on retry).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    get(path)
      .then((raw) => {
        if (cancelled) return;
        if (raw == null) {
          setValue(initialRef.current);
        } else {
          setValue(fromServerRef.current(raw));
          cacheSet(channel, raw);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, channel, reloadToken]);

  // Apply realtime updates broadcast by other clients.
  useEffect(() => {
    const socket = getSocket();
    const handler = (raw, origin) => {
      if (origin && origin === getClientId()) return; // skip our own echo
      if (raw == null) return;
      setValue(fromServerRef.current(raw));
      cacheSet(channel, raw);
    };
    socket.on(channel, handler);
    return () => socket.off(channel, handler);
  }, [channel]);

  const debouncedPostRef = useRef();
  if (!debouncedPostRef.current) {
    debouncedPostRef.current = debounce((targetPath, payload) => {
      post(targetPath, payload).catch(() => {
        toast.error(
          'Could not save',
          'Your change is shown here but did not reach the archive.',
          'save-error'
        );
      });
    }, 400);
  }

  useEffect(() => {
    const debounced = debouncedPostRef.current;
    return () => debounced?.cancel();
  }, []);

  // `next` may be a value or an updater function, mirroring useState.
  const save = useCallback(
    (next) => {
      const resolved =
        typeof next === 'function' ? next(valueRef.current) : next;
      setValue(resolved);
      const payload = toServerRef.current(resolved);
      cacheSet(channel, payload);
      debouncedPostRef.current(path, payload);
    },
    [channel, path]
  );

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { value, save, loading, error, reload };
};
