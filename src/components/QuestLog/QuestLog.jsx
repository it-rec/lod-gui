import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import Button from '../common/Button/Button';
import FormattedText from '../common/FormattedText/FormattedText';
import { IconScroll, IconCheck, IconLock } from '../common/icons';
import { REVEAL_EVENT } from '../common/Panel/Panel';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections, gamePath } from '../../shared';
import { normalizeQuests, questIsUnlocked } from '../Quests/Quests';
import styles from './QuestLog.module.scss';

const OPEN_EVENT = 'lod:questlog:open';

// Returns true while focus is inside an input/textarea/contenteditable so the
// `q` shortcut never steals a keystroke from someone typing in a panel.
const inEditableField = () => {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (active.isContentEditable) return true;
  return false;
};

export const openQuestLog = () => {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
};

// A small, unobtrusive trigger for the header tool row. The quest log is an
// optional glance — the authoritative Quests panel stays in the notebook.
export const QuestLogButton = () => (
  <Button
    kind="ghost"
    size="sm"
    iconOnly
    aria-haspopup="dialog"
    aria-label="Quest log (Q)"
    title="Quest log (Q)"
    onClick={openQuestLog}
  >
    <IconScroll />
  </Button>
);

// A read-only, dismissible overview of every quest, summoned without
// disturbing the layout: a quiet header button, the `q` shortcut, or the
// programmatic open event. Editing still lives in the Quests panel — a footer
// link reveals it. Reads the same QUESTS channel as the panel, so realtime
// edits from peers (and your own) flow straight through.
const QuestLog = () => {
  const [open, setOpen] = useState(false);
  // 'log' is the active/completed writ; 'overview' is the standing summary.
  const [view, setView] = useState('log');
  // When the reader jumps from an overview tile back into the log, we briefly
  // flag the entry so the eye lands on the right line.
  const [highlightId, setHighlightId] = useState(null);
  const entryRefs = useRef(new Map());
  const { value, loading } = useGameChannel({
    channel: collections.QUESTS,
    path: gamePath('quests'),
    initial: [],
    fromServer: normalizeQuests,
    toServer: (list) => ({ quests: list }),
  });

  useEffect(() => {
    const onKey = (event) => {
      if (
        (event.key === 'q' || event.key === 'Q') &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !inEditableField()
      ) {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        setOpen(false);
      }
    };
    const onOpen = () => {
      setView('log');
      setOpen(true);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setHighlightId(null);
  }, []);

  const { active, completed } = useMemo(
    () => ({
      active: value.filter((quest) => !quest.isDone),
      completed: value.filter((quest) => quest.isDone),
    }),
    [value]
  );

  // Each completed quest paired with the prerequisites it cleared — the
  // evidence of the road already walked.
  const overviewTiles = useMemo(
    () =>
      completed.map((quest) => ({
        quest,
        fulfilled: (quest.dependsOn || [])
          .map((id) => value.find((q) => q.id === id))
          .filter((parent) => parent && parent.isDone),
      })),
    [completed, value]
  );

  // Returning to the log from a tile: switch views and let the highlight
  // effect scroll the matching entry into focus.
  const focusInLog = useCallback((id) => {
    setView('log');
    setHighlightId(id);
  }, []);

  useEffect(() => {
    if (!highlightId || view !== 'log') return undefined;
    const node = entryRefs.current.get(highlightId);
    if (node) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const timer = setTimeout(() => setHighlightId(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightId, view]);

  // Hand off to the in-place panel for any real editing.
  const revealPanel = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(REVEAL_EVENT, { detail: { panel: 'quests' } })
    );
    setOpen(false);
  }, []);

  if (!open) return null;

  const total = value.length;
  const doneCount = completed.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const subtitle = loading
    ? 'Unfurling the writ…'
    : total === 0
      ? 'No quests recorded'
      : `${active.length} active · ${doneCount} completed`;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Quest log"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        className={cx(styles.modal, {
          [styles.modalWide]: view === 'overview',
        })}
      >
        <header className={styles.header}>
          <div className={styles.headingWrap}>
            <IconScroll className={styles.headerIcon} aria-hidden="true" />
            <div>
              <h2 className={styles.title}>Quest Log</h2>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>
          </div>
          <kbd className={styles.kbd}>ESC</kbd>
        </header>

        {!loading && total > 0 && (
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={doneCount}
            aria-label={`${doneCount} of ${total} quests completed`}
          >
            <span
              className={styles.progressFill}
              style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
            />
          </div>
        )}

        {!loading && total > 0 && (
          <div
            className={styles.viewToggle}
            role="group"
            aria-label="Quest log view"
          >
            <button
              type="button"
              className={cx(styles.viewOption, {
                [styles.viewOptionActive]: view === 'log',
              })}
              onClick={() => setView('log')}
              aria-pressed={view === 'log'}
            >
              Log
            </button>
            <button
              type="button"
              className={cx(styles.viewOption, {
                [styles.viewOptionActive]: view === 'overview',
              })}
              onClick={() => setView('overview')}
              aria-pressed={view === 'overview'}
            >
              Overview
            </button>
          </div>
        )}

        <div className={styles.body}>
          {loading ? (
            <p className={styles.empty}>Reading the quest writ…</p>
          ) : total === 0 ? (
            <p className={styles.empty}>
              No quests yet. Pledge one in the Quests panel when an errand finds
              the party.
            </p>
          ) : view === 'overview' ? (
            <section className={styles.overview} aria-label="Quest standing">
              <div className={styles.standing}>
                <span
                  className={styles.standingPct}
                  aria-hidden="true"
                >{`${pct}%`}</span>
                <div className={styles.standingMeta}>
                  <p className={styles.standingHead}>Where the party stands</p>
                  <p className={styles.standingSub}>
                    {doneCount} of {total} quests completed
                  </p>
                </div>
              </div>
              {completed.length === 0 ? (
                <p className={styles.empty}>
                  No quests completed yet — your tale is still being written.
                </p>
              ) : (
                <ul className={styles.tiles}>
                  {overviewTiles.map(({ quest, fulfilled }) => (
                    <li key={quest.id}>
                      <button
                        type="button"
                        className={styles.tile}
                        onClick={() => focusInLog(quest.id)}
                        aria-label={`${quest.title}, completed — open in the quest log`}
                      >
                        <span className={styles.tileHead}>
                          <span
                            className={styles.tileCheck}
                            aria-hidden="true"
                          >
                            <IconCheck />
                          </span>
                          <span className={styles.tileTitle}>
                            {quest.title}
                          </span>
                        </span>
                        {fulfilled.length > 0 ? (
                          <span className={styles.tilePrereqs}>
                            <span className={styles.tilePrereqLabel}>
                              Prerequisites met
                            </span>
                            <span className={styles.tilePrereqList}>
                              {fulfilled.map((parent) => (
                                <span
                                  key={parent.id}
                                  className={styles.tilePrereq}
                                >
                                  <IconCheck aria-hidden="true" />
                                  {parent.title}
                                </span>
                              ))}
                            </span>
                          </span>
                        ) : (
                          <span className={styles.tilePrereqsNone}>
                            No prerequisites
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <>
              <section className={styles.group}>
                <h3 className={styles.groupTitle}>
                  Active <span className={styles.count}>{active.length}</span>
                </h3>
                {active.length === 0 ? (
                  <p className={styles.groupEmpty}>
                    Every pledge has been fulfilled.
                  </p>
                ) : (
                  <ul className={styles.list}>
                    {active.map((quest) => {
                      const isLocked = !questIsUnlocked(quest, value);
                      const blockingParents = (quest.dependsOn || [])
                        .map((id) => value.find((q) => q.id === id))
                        .filter((q) => q && !q.isDone);
                      return (
                        <li
                          key={quest.id}
                          className={cx(styles.entry, {
                            [styles.entryLocked]: isLocked,
                          })}
                        >
                          <span className={styles.marker} aria-hidden="true">
                            {isLocked ? <IconLock /> : null}
                          </span>
                          <div className={styles.entryBody}>
                            <p className={styles.entryTitle}>{quest.title}</p>
                            {isLocked && blockingParents.length > 0 && (
                              <p className={styles.lockHint}>
                                Blocked until{' '}
                                {blockingParents.map((p) => p.title).join(', ')}
                              </p>
                            )}
                            {quest.notes && (
                              <FormattedText
                                className={styles.notes}
                                text={quest.notes}
                              />
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {completed.length > 0 && (
                <section className={styles.group}>
                  <h3 className={styles.groupTitle}>
                    Completed{' '}
                    <span className={styles.count}>{completed.length}</span>
                  </h3>
                  <ul className={styles.list}>
                    {completed.map((quest) => (
                      <li
                        key={quest.id}
                        ref={(node) => {
                          if (node) entryRefs.current.set(quest.id, node);
                          else entryRefs.current.delete(quest.id);
                        }}
                        className={cx(styles.entry, styles.entryDone, {
                          [styles.entryHighlight]: highlightId === quest.id,
                        })}
                      >
                        <span className={styles.marker} aria-hidden="true">
                          <IconCheck />
                        </span>
                        <div className={styles.entryBody}>
                          <p className={styles.entryTitle}>{quest.title}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <Button kind="ghost" size="sm" onClick={revealPanel}>
            Open the Quests panel
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default QuestLog;
