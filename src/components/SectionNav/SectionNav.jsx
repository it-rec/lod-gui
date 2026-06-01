import { useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { IconCompass } from '../common/icons';
import { REVEAL_EVENT } from '../common/Panel/Panel';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { JUMP_SECTIONS } from '../../appSections';
import styles from './SectionNav.module.scss';

// Extra page height (beyond one viewport) before a jump nav earns its keep.
const SCROLL_SLACK = 240;

// Which section the reader is currently within: the last one whose top has
// scrolled above an anchor line near the top of the viewport. `topOf` returns
// a section's viewport-relative top, or null if it isn't on the page.
export const activeSectionKey = (sections, topOf, anchor = 140) => {
  let active = null;
  for (const section of sections) {
    const top = topOf(section.key);
    if (top == null) continue;
    if (top - anchor <= 0) active = section.key;
  }
  return active;
};

// A quiet bottom-corner launcher that opens a menu of every panel and scrolls
// to the chosen one — the answer to "where did the Locations panel go?" on a
// tall, single-column phone layout. It only appears once the page is long
// enough to be worth jumping around, and reuses the same reveal event the
// global search fires, so a jump also uncollapses and flashes the target.
const SectionNav = () => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const trapRef = useFocusTrap(open);
  const rootRef = useRef(null);

  const measure = useCallback(() => {
    const doc = document.documentElement;
    setVisible(doc.scrollHeight > window.innerHeight + SCROLL_SLACK);
    setActiveKey(
      activeSectionKey(JUMP_SECTIONS, (key) => {
        const el = document.querySelector(`[data-panel-key="${key}"]`);
        return el ? el.getBoundingClientRect().top : null;
      })
    );
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  // Dismiss the menu on Escape or a click outside it.
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

  const jump = (key) => {
    window.dispatchEvent(
      new CustomEvent(REVEAL_EVENT, { detail: { panel: key } })
    );
    setOpen(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.root} ref={rootRef}>
      {open && (
        <div
          ref={trapRef}
          className={styles.menu}
          role="menu"
          aria-label="Jump to section"
        >
          {JUMP_SECTIONS.map((section) => {
            const Icon = section.Icon;
            return (
              <button
                key={section.key}
                type="button"
                role="menuitem"
                className={cx(styles.item, {
                  [styles.itemActive]: section.key === activeKey,
                })}
                onClick={() => jump(section.key)}
              >
                <span className={styles.itemIcon} aria-hidden="true">
                  <Icon />
                </span>
                {section.label}
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className={styles.toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Jump to section"
        title="Jump to section"
        onClick={() => setOpen((value) => !value)}
      >
        <IconCompass />
      </button>
    </div>
  );
};

export default SectionNav;
