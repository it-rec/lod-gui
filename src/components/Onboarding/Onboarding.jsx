import { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';
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

const STEPS = [
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
    text: 'Drag the handle on a panel to reorder it, and collapse any panel you don’t need.',
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
// demand — a short guided tour, one tip per step, of the realtime nature of
// the app and the handful of shortcuts that are easy to miss (search,
// rearrange, undo, jump).
const Onboarding = () => {
  const [open, setOpen] = useState(() => !hasSeenOnboarding());
  const [step, setStep] = useState(0);
  const trapRef = useFocusTrap(open);
  const lastStep = STEPS.length - 1;

  const close = useCallback(() => {
    setOpen(false);
    prefSet(SEEN_KEY, true);
  }, []);

  const go = useCallback(
    (next) => setStep(() => Math.max(0, Math.min(lastStep, next))),
    [lastStep]
  );

  useEffect(() => {
    const onOpen = () => {
      setStep(0);
      setOpen(true);
    };
    const onKey = (event) => {
      if (!open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowRight') {
        setStep((current) => Math.min(lastStep, current + 1));
      } else if (event.key === 'ArrowLeft') {
        setStep((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, lastStep]);

  if (!open) return null;

  const { Icon, title, text } = STEPS[step];
  const isLast = step === lastStep;

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
            <p className={styles.eyebrow}>
              Welcome, storyteller · {step + 1} of {STEPS.length}
            </p>
            <h2 id="onboarding-title" className={styles.title}>
              Your Campaign Companion
            </h2>
          </div>
        </header>

        <div className={styles.step} aria-live="polite">
          <span className={styles.stepIcon} aria-hidden="true">
            <Icon />
          </span>
          <h3 className={styles.stepTitle}>{title}</h3>
          <p className={styles.stepText}>{text}</p>
        </div>

        <div className={styles.dots} role="tablist" aria-label="Tour progress">
          {STEPS.map((s, index) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={index === step}
              aria-label={`Step ${index + 1}: ${s.title}`}
              className={cx(styles.dot, { [styles.dotActive]: index === step })}
              onClick={() => go(index)}
            />
          ))}
        </div>

        <footer className={styles.footer}>
          <Button kind="ghost" size="sm" onClick={close}>
            Skip tour
          </Button>
          <div className={styles.nav}>
            {step > 0 && (
              <Button kind="ghost" size="sm" onClick={() => go(step - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button kind="gold" onClick={close}>
                Enter the tome
              </Button>
            ) : (
              <Button kind="gold" onClick={() => go(step + 1)}>
                Next
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Onboarding;
