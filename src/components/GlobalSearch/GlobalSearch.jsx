import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import TextInput from '../common/TextInput/TextInput';
import Button from '../common/Button/Button';
import { IconSearch } from '../common/icons';
import { REVEAL_EVENT } from '../common/Panel/Panel';
import { buildSearchIndex, searchRecords } from './searchIndex';
import styles from './GlobalSearch.module.scss';

const OPEN_EVENT = 'lod:search:open';

export const openGlobalSearch = (query) => {
  window.dispatchEvent(
    new CustomEvent(OPEN_EVENT, { detail: { query: query || '' } })
  );
};

export const GlobalSearchButton = () => (
  <Button
    kind="ghost"
    size="sm"
    iconOnly
    aria-label="Search the campaign (Ctrl+K)"
    title="Search the campaign (Ctrl+K)"
    onClick={openGlobalSearch}
  >
    <IconSearch />
  </Button>
);

const CATEGORY_LABELS = {
  Quest: 'Quest',
  Person: 'Person',
  Location: 'Location',
  Keyword: 'Keyword',
  Journal: 'Journal',
};

// Returns true while focus is inside an input/textarea/contenteditable so the
// `/` shortcut never steals a keystroke from the player typing in a panel.
const inEditableField = () => {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (active.isContentEditable) return true;
  return false;
};

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);

  // Open with Cmd/Ctrl+K or `/` (when not typing somewhere else), or by an
  // explicit programmatic event from the header button.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !inEditableField()) {
        event.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = (event) => {
      const seed = event?.detail?.query;
      if (typeof seed === 'string' && seed) setQuery(seed);
      setOpen(true);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  // Build the index whenever the overlay opens so it always reflects the
  // latest data — including changes pushed by peers while we sat closed.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    buildSearchIndex().then((next) => {
      if (!cancelled) setRecords(next);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
    setQuery('');
    setHighlight(0);
    return undefined;
  }, [open]);

  const results = useMemo(() => searchRecords(records, query, 25), [records, query]);

  // Clamp the cursor whenever the result set shrinks.
  useEffect(() => {
    setHighlight((current) => Math.min(current, Math.max(0, results.length - 1)));
  }, [results.length]);

  const close = useCallback(() => setOpen(false), []);

  const pick = useCallback((record) => {
    if (!record) return;
    const panel = record.target?.panel;
    if (panel) {
      window.dispatchEvent(
        new CustomEvent(REVEAL_EVENT, { detail: { panel, id: record.id } })
      );
    }
    setOpen(false);
  }, []);

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((index) => Math.min(index + 1, results.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      pick(results[highlight]);
    }
  };

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className={styles.modal} onKeyDown={onKeyDown}>
        <div className={styles.searchRow}>
          <IconSearch className={styles.searchIcon} aria-hidden="true" />
          <TextInput
            ref={inputRef}
            className={styles.input}
            value={query}
            placeholder="Search quests, people, places, keywords, journal…"
            aria-label="Search the campaign"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
          <kbd className={styles.kbd}>ESC</kbd>
        </div>
        {query.trim() === '' ? (
          <p className={styles.hint}>
            Start typing to search across the whole campaign.
            <br />
            Use <kbd className={styles.kbd}>↑</kbd>{' '}
            <kbd className={styles.kbd}>↓</kbd> to move,{' '}
            <kbd className={styles.kbd}>Enter</kbd> to jump.
          </p>
        ) : results.length === 0 ? (
          <p className={styles.empty}>
            Nothing matches &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <ul className={styles.results} role="listbox">
            {results.map((record, index) => (
              <li key={`${record.category}-${record.id}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  className={cx(styles.result, {
                    [styles.resultActive]: index === highlight,
                  })}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => pick(record)}
                >
                  <span
                    className={cx(
                      styles.category,
                      styles[`category-${record.category.toLowerCase()}`]
                    )}
                  >
                    {CATEGORY_LABELS[record.category] || record.category}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.label}>{record.label}</span>
                    {record.meta && (
                      <span className={styles.meta}>{record.meta}</span>
                    )}
                    {record.detail && (
                      <span className={styles.detail}>
                        {record.detail.length > 120
                          ? `${record.detail.slice(0, 117)}…`
                          : record.detail}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
