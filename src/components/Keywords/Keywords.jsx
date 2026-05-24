import { useMemo, useState } from 'react';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import { IconKey, IconPlus, IconTrash, IconSearch } from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';
import styles from './Keywords.module.scss';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `kw-${Math.random().toString(36).slice(2, 10)}`;

// Accepts both the current { id, text } objects and any legacy plain strings.
const normalizeKeywords = (raw) => {
  const list = Array.isArray(raw?.keywords)
    ? raw.keywords
    : Array.isArray(raw)
      ? raw
      : [];
  return list
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim() ? { id: uid(), text: entry.trim() } : null;
      }
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.text === 'string' &&
        entry.text.trim()
      ) {
        return { id: entry.id || uid(), text: entry.text };
      }
      return null;
    })
    .filter(Boolean);
};

const INITIAL = [];

const Keywords = () => {
  const { value, save, loading, error, reload } = useGameChannel({
    channel: collections.KEYWORDS,
    path: '/api/game/1/keywords/',
    initial: INITIAL,
    fromServer: normalizeKeywords,
    toServer: (list) => ({ keywords: list }),
  });
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      trimmedQuery
        ? value.filter((keyword) =>
          keyword.text.toLowerCase().includes(trimmedQuery)
        )
        : value,
    [value, trimmedQuery]
  );

  const add = () => {
    const text = draft.trim();
    if (text) save([...value, { id: uid(), text }]);
    setDraft('');
  };

  return (
    <Panel
      icon={<IconKey />}
      title="Keywords"
      subtitle={
        loading
          ? 'Recalling what was noted…'
          : `${value.length} recorded`
      }
      error={error}
      onRetry={reload}
    >
      {loading ? (
        <Skeleton height="8rem" />
      ) : (
        <div className={styles.keywords}>
          <div className={styles.add}>
            <TextInput
              value={draft}
              placeholder="Record a keyword or story note…"
              aria-label="New keyword"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <Button kind="gold" onClick={add}>
              <IconPlus />
              Record
            </Button>
          </div>

          {value.length > 3 && (
            <label className={styles.search}>
              <IconSearch className={styles.searchIcon} aria-hidden="true" />
              <TextInput
                variant="sm"
                value={query}
                placeholder="Search keywords…"
                aria-label="Search keywords"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          )}

          {value.length === 0 ? (
            <p className={styles.empty}>
              No keywords yet. The storybook will tell you when to record one.
            </p>
          ) : visible.length === 0 ? (
            <p className={styles.empty}>
              No keywords match &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul className={styles.list}>
              {visible.map((keyword) => (
                <li key={keyword.id} className={styles.entry}>
                  <span className={styles.bullet} aria-hidden="true">
                    ❧
                  </span>
                  <span className={styles.text}>{keyword.text}</span>
                  <Button
                    kind="danger"
                    size="sm"
                    iconOnly
                    aria-label={`Remove ${keyword.text}`}
                    onClick={() =>
                      save(value.filter((entry) => entry.id !== keyword.id))
                    }
                  >
                    <IconTrash />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
};

export default Keywords;
