import { useEffect, useRef, useState } from 'react';
import Button from '../common/Button/Button';
import {
  IconMore,
  IconSearch,
  IconScroll,
  IconHelp,
  IconParty,
} from '../common/icons';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { openGlobalSearch } from '../GlobalSearch/GlobalSearch';
import { openQuestLog } from '../QuestLog/QuestLog';
import { openKeyboardHelp } from '../KeyboardHelp/KeyboardHelp';
import { openOnboarding } from '../Onboarding/Onboarding';
import styles from './OverflowMenu.module.scss';

// Tidy home for the header's quick utilities. It keeps the toolbar from
// spilling on small screens — the search / quest-log / shortcuts buttons are
// hidden inline there and reached from here instead — and is the only place
// the welcome guide can be summoned again.
const ITEMS = [
  { key: 'search', label: 'Search the campaign', hint: 'Ctrl K', Icon: IconSearch, run: openGlobalSearch },
  { key: 'questlog', label: 'Quest log', hint: 'Q', Icon: IconScroll, run: openQuestLog },
  { key: 'shortcuts', label: 'Keyboard shortcuts', hint: '?', Icon: IconHelp, run: openKeyboardHelp },
  { key: 'welcome', label: 'Welcome guide', Icon: IconParty, run: openOnboarding },
];

const OverflowMenu = () => {
  const [open, setOpen] = useState(false);
  const trapRef = useFocusTrap(open);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  const choose = (run) => {
    setOpen(false);
    run();
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <Button
        kind="ghost"
        size="sm"
        iconOnly
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        title="More actions"
        onClick={() => setOpen((value) => !value)}
      >
        <IconMore />
      </Button>
      {open && (
        <div
          ref={trapRef}
          className={styles.menu}
          role="menu"
          aria-label="More actions"
        >
          {ITEMS.map(({ key, label, hint, Icon, run }) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => choose(run)}
            >
              <span className={styles.itemIcon} aria-hidden="true">
                <Icon />
              </span>
              <span className={styles.itemLabel}>{label}</span>
              {hint && <kbd className={styles.itemHint}>{hint}</kbd>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OverflowMenu;
