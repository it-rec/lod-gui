import { useCallback, useEffect, useState } from 'react';
import Button from '../common/Button/Button';
import Crest from '../common/Crest/Crest';
import {
  IconPeople,
  IconSearch,
  IconGrip,
  IconScroll,
  IconCompass,
} from '../common/icons';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { prefGet, prefSet } from '../../utils/localStorageUtil';
import styles from './Onboarding.module.scss';

// Bump the suffix to re-greet returning players after a notable change.
const SEEN_KEY = 'onboarding-seen:1';
const OPEN_EVENT = 'lod:onboarding:open';

// Re-open the welcome from anywhere (e.g. a header menu item).
export const openOnboarding = () =>
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));

export const hasSeenOnboarding = () => prefGet(SEEN_KEY) === true;

const TIPS = [
  {
    Icon: IconPeople,
    title: 'Everyone shares one tome',
    text: 'Every edit syncs live to every player at the table — the party, the purse, the tale.',
  },
  {
    Icon: IconSearch,
    title: 'Find anything fast',
    text: 'Press Ctrl/⌘ + K to search the whole campaign, or ? to see every keyboard shortcut.',
  },
  {
    Icon: IconGrip,
    title: 'Make it yours',
    text: 'Drag the handle on a notebook panel to reorder it, and collapse any panel you don’t need.',
  },
  {
    Icon: IconScroll,
    title: 'Nothing is truly lost',
    text: 'Delete something by mistake? Tap Undo in the notice that pops up to bring it right back.',
  },
  {
    Icon: IconCompass,
    title: 'Jump around',
    text: 'On a long page, the compass in the corner leaps straight to any section.',
  },
];

// A one-time welcome shown on a device's first visit, and re-openable on
// demand. Introduces the realtime nature of the app and the handful of
// shortcuts that make it pleasant — including the rearrange, undo and jump
// features that are easy to miss.
const Onboarding = () => {
  const [open, setOpen] = useState(() => !hasSeenOnboarding());
  const trapRef = useFocusTrap(open);

  const close = useCallback(() => {
    setOpen(false);
    prefSet(SEEN_KEY, true);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (event) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      ref={trapRef}
      tabIndex={-1}
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <Crest className={styles.crest} />
          <div>
            <p className={styles.eyebrow}>Welcome, storyteller</p>
            <h2 id="onboarding-title" className={styles.title}>
              Your Campaign Companion
            </h2>
          </div>
        </header>

        <ul className={styles.tips}>
          {TIPS.map(({ Icon, title, text }) => (
            <li key={title} className={styles.tip}>
              <span className={styles.tipIcon} aria-hidden="true">
                <Icon />
              </span>
              <span className={styles.tipBody}>
                <span className={styles.tipTitle}>{title}</span>
                <span className={styles.tipText}>{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <footer className={styles.footer}>
          <Button kind="gold" onClick={close}>
            Enter the tome
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default Onboarding;
