import { useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import TextInput from '../common/TextInput/TextInput';
import { IconScroll, IconCheck, IconSearch } from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';
import styles from './StoryPoints.module.scss';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ENTRIES_PER_CHAPTER = 8;
const TOTAL = LETTERS.length * ENTRIES_PER_CHAPTER;

// Builds the canonical A1–Z8 chronicle and overlays the saved done-state by
// label. Doing it this way migrates any older/partial saved data (the legacy
// generator skipped the letter "T") onto a complete, well-formed grid.
const buildChronicle = (saved) => {
  const doneByLabel = new Map();
  if (Array.isArray(saved)) {
    saved.forEach((entry) => {
      if (entry && typeof entry.label === 'string') {
        doneByLabel.set(entry.label, Boolean(entry.isDone));
      }
    });
  }
  const chronicle = [];
  LETTERS.forEach((letter) => {
    for (let n = 1; n <= ENTRIES_PER_CHAPTER; n += 1) {
      const label = `${letter}${n}`;
      chronicle.push({ label, isDone: doneByLabel.get(label) || false });
    }
  });
  return chronicle;
};

const EMPTY_CHRONICLE = buildChronicle();

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Unfinished' },
  { id: 'done', label: 'Completed' },
];

const StoryPoints = () => {
  const {
    value: entries,
    save,
    loading,
    error,
    reload,
  } = useGameChannel({
    channel: collections.STORY_POINTS,
    path: '/api/game/1/storyPoints/',
    initial: EMPTY_CHRONICLE,
    fromServer: buildChronicle,
    toServer: (list) => list,
  });

  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const chapterRefs = useRef({});

  const doneCount = useMemo(
    () => entries.filter((entry) => entry.isDone).length,
    [entries]
  );
  const percent = Math.round((doneCount / TOTAL) * 100);

  const chapters = useMemo(
    () =>
      LETTERS.map((letter) => {
        const chapterEntries = entries.filter((entry) => entry.label[0] === letter);
        return {
          letter,
          entries: chapterEntries,
          done: chapterEntries.filter((entry) => entry.isDone).length,
        };
      }),
    [entries]
  );

  const toggle = (label) =>
    save(
      entries.map((entry) =>
        entry.label === label ? { ...entry, isDone: !entry.isDone } : entry
      )
    );

  const trimmedQuery = query.trim().toUpperCase();

  const matches = (entry) => {
    const passesFilter =
      filter === 'all' || (filter === 'open' ? !entry.isDone : entry.isDone);
    const passesQuery =
      !trimmedQuery || entry.label.includes(trimmedQuery);
    return passesFilter && passesQuery;
  };

  const scrollToChapter = (letter) =>
    chapterRefs.current[letter]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

  const visibleChapters = chapters.filter((chapter) =>
    chapter.entries.some(matches)
  );

  return (
    <Panel
      icon={<IconScroll />}
      title="The Chronicle"
      subtitle={
        loading
          ? 'Unrolling the scroll…'
          : `${doneCount} of ${TOTAL} entries recorded`
      }
      error={error}
      onRetry={reload}
    >
      {loading ? (
        <div className={styles.loading}>
          <Skeleton height="2.5rem" />
          <Skeleton height="14rem" />
        </div>
      ) : (
        <div className={styles.chronicle}>
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {percent}% chronicled
            </span>
          </div>

          <div className={styles.controls}>
            <div className={styles.filters} role="group" aria-label="Filter entries">
              {FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cx(styles.filter, {
                    [styles.filterActive]: filter === option.id,
                  })}
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className={styles.search}>
              <IconSearch className={styles.searchIcon} aria-hidden="true" />
              <TextInput
                variant="sm"
                value={query}
                placeholder="Find e.g. A3"
                aria-label="Find entry"
                maxLength={3}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <nav className={styles.chapterNav} aria-label="Jump to chapter">
              {chapters.map((chapter) => (
                <button
                  key={chapter.letter}
                  type="button"
                  className={cx(styles.navLetter, {
                    [styles.navComplete]: chapter.done === ENTRIES_PER_CHAPTER,
                    [styles.navStarted]:
                      chapter.done > 0 && chapter.done < ENTRIES_PER_CHAPTER,
                  })}
                  onClick={() => scrollToChapter(chapter.letter)}
                  aria-label={`Chapter ${chapter.letter}, ${chapter.done} of ${ENTRIES_PER_CHAPTER} done`}
                >
                  {chapter.letter}
                </button>
              ))}
            </nav>
          </div>

          {visibleChapters.length === 0 ? (
            <p className={styles.empty}>
              {trimmedQuery
                ? `No entries match "${query.trim()}".`
                : filter === 'done'
                  ? 'No entries have been recorded yet.'
                  : 'Every entry has been chronicled. The tale is complete.'}
            </p>
          ) : (
            <div className={styles.chapters}>
              {visibleChapters.map((chapter) => (
                <section
                  key={chapter.letter}
                  className={styles.chapter}
                  ref={(node) => {
                    chapterRefs.current[chapter.letter] = node;
                  }}
                >
                  <header className={styles.chapterHead}>
                    <span className={styles.chapterLetter}>{chapter.letter}</span>
                    <span className={styles.chapterMeta}>
                      Chapter {chapter.letter}
                    </span>
                    <span
                      className={cx(styles.chapterCount, {
                        [styles.chapterDone]:
                          chapter.done === ENTRIES_PER_CHAPTER,
                      })}
                    >
                      {chapter.done}/{ENTRIES_PER_CHAPTER}
                    </span>
                  </header>
                  <div className={styles.entries}>
                    {chapter.entries.filter(matches).map((entry) => (
                      <button
                        key={entry.label}
                        type="button"
                        className={cx(styles.entry, {
                          [styles.entryDone]: entry.isDone,
                        })}
                        onClick={() => toggle(entry.label)}
                        aria-pressed={entry.isDone}
                        aria-label={`Entry ${entry.label}${
                          entry.isDone ? ', recorded' : ''
                        }`}
                      >
                        <span className={styles.entryLabel}>{entry.label}</span>
                        {entry.isDone && (
                          <IconCheck className={styles.entryCheck} />
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
};

export default StoryPoints;
