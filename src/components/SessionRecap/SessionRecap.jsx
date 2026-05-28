import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../common/Button/Button';
import {
  IconScroll,
  IconCoins,
  IconRenown,
  IconQuest,
  IconPeople,
  IconMap,
  IconCheck,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';
import { toast } from '../common/Toast/toastStore';
import { summariseRecap, recapToText } from './sessionRecap';
import styles from './SessionRecap.module.scss';

const PHASE_IDS = ['morning', 'afternoon', 'evening', 'night'];
const PHASE_LABEL = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

const safeNumber = (raw, fallback = 0) =>
  Number.isFinite(raw) ? raw : fallback;

const SessionRecap = ({ open, onClose }) => {
  const [copied, setCopied] = useState(false);

  const { value: calendar } = useGameChannel({
    channel: collections.CALENDAR,
    path: '/api/game/1/calendar/',
    initial: { day: 1, time: 'morning', adventure: '' },
    fromServer: (raw) => ({
      day: safeNumber(raw?.day, 1),
      time: PHASE_IDS.includes(raw?.time) ? raw.time : 'morning',
      adventure: typeof raw?.adventure === 'string' ? raw.adventure : '',
    }),
  });
  const { value: gold } = useGameChannel({
    channel: collections.GOLD,
    path: '/api/game/1/gold/',
    initial: 0,
    fromServer: (raw) => safeNumber(raw?.gold, 0),
  });
  const { value: fame } = useGameChannel({
    channel: collections.FAME,
    path: '/api/game/1/fame/',
    initial: 0,
    fromServer: (raw) => safeNumber(raw?.fame, 0),
  });
  const { value: heroes } = useGameChannel({
    channel: collections.HEROES,
    path: '/api/game/1/heroes/',
    initial: [],
    fromServer: (raw) => (Array.isArray(raw?.heroes) ? raw.heroes : []),
  });
  const { value: quests } = useGameChannel({
    channel: collections.QUESTS,
    path: '/api/game/1/quests/',
    initial: [],
    fromServer: (raw) => (Array.isArray(raw?.quests) ? raw.quests : []),
  });
  const { value: npcs } = useGameChannel({
    channel: collections.NPCS,
    path: '/api/game/1/npcs/',
    initial: [],
    fromServer: (raw) => (Array.isArray(raw?.npcs) ? raw.npcs : []),
  });
  const { value: locations } = useGameChannel({
    channel: collections.LOCATIONS,
    path: '/api/game/1/locations/',
    initial: [],
    fromServer: (raw) => (Array.isArray(raw?.locations) ? raw.locations : []),
  });
  const { value: journal } = useGameChannel({
    channel: collections.JOURNAL,
    path: '/api/game/1/journal/',
    initial: [],
    fromServer: (raw) => (Array.isArray(raw?.entries) ? raw.entries : []),
  });

  const recap = useMemo(
    () =>
      summariseRecap({
        calendar,
        gold,
        fame,
        heroes,
        quests,
        npcs,
        locations,
        journal,
        recentJournalLimit: 6,
      }),
    [calendar, gold, fame, heroes, quests, npcs, locations, journal]
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recapToText(recap));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed', 'Your browser blocked clipboard access.', 'recap-copy');
    }
  };

  // Portalled to <body> so the fixed backdrop fills the viewport and
  // doesn't get clipped by a positioned ancestor (the CampaignMenu wrapper
  // creates a containing block via its z-index stacking context).
  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        role="dialog"
        aria-label="Session recap"
        aria-modal="true"
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <p className={styles.eyebrow}>Where the party stands</p>
          <h2 className={styles.title}>{recap.adventure}</h2>
          <p className={styles.when}>
            Day {recap.day} · {recap.timeLabel}
            {recap.party.length > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{recap.party.join(', ')}</span>
              </>
            )}
          </p>
        </header>

        <div className={styles.stats}>
          <Stat icon={<IconCoins />} label="Gold" value={recap.counts.gold} />
          <Stat icon={<IconRenown />} label="Fame" value={recap.counts.fame} />
          <Stat
            icon={<IconQuest />}
            label="Quests"
            value={`${recap.counts.questsActive} active`}
            sub={`${recap.counts.questsCompleted} done`}
          />
          <Stat
            icon={<IconPeople />}
            label="People"
            value={recap.counts.npcsTotal}
            sub={`${recap.counts.allies} allies · ${recap.counts.foes} foes`}
          />
          <Stat
            icon={<IconMap />}
            label="Locations"
            value={recap.counts.locationsTotal}
            sub={`${recap.counts.locationsVisited} visited · ${recap.counts.locationsRumored} rumored`}
          />
        </div>

        <section className={styles.journalSection}>
          <h3 className={styles.journalTitle}>Recent journal</h3>
          {recap.recentJournal.length === 0 ? (
            <p className={styles.empty}>No journal entries yet.</p>
          ) : (
            <ul className={styles.journalList}>
              {recap.recentJournal.map((entry, idx) => (
                <li key={entry.id || idx} className={styles.journalItem}>
                  <span className={styles.journalStamp}>
                    Day {entry.day ?? '?'}
                    {entry.time && PHASE_LABEL[entry.time]
                      ? ` · ${PHASE_LABEL[entry.time]}`
                      : ''}
                  </span>
                  <span className={styles.journalText}>{entry.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className={styles.actions}>
          <Button kind="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button kind={copied ? 'gold' : 'primary'} size="sm" onClick={handleCopy}>
            {copied ? <IconCheck /> : <IconScroll />}
            {copied ? 'Copied' : 'Copy as text'}
          </Button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

const Stat = ({ icon, label, value, sub }) => (
  <div className={styles.stat}>
    <span className={styles.statIcon} aria-hidden="true">
      {icon}
    </span>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue}>{value}</span>
    {sub && <span className={styles.statSub}>{sub}</span>}
  </div>
);

export default SessionRecap;
