import { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import Button from '../Button/Button';
import { IconChevron } from '../icons';
import { prefGet, prefSet } from '../../../utils/localStorageUtil';
import styles from './Panel.module.scss';

export const REVEAL_EVENT = 'lod:reveal';

// A framed section of the campaign ledger: a crimson title bar over a
// parchment body. Renders a uniform error/retry state when `error` is set.
//
// Pass `collapsibleKey` to make the panel foldable — the open/closed state is
// persisted per device under that key, so players can collapse panels they
// don't need (especially valuable on small screens).
const Panel = ({
  icon,
  title,
  subtitle,
  actions,
  error,
  onRetry,
  collapsibleKey,
  defaultCollapsed = false,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsibleKey) return false;
    const stored = prefGet(`panel-collapsed:${collapsibleKey}`);
    return typeof stored === 'boolean' ? stored : defaultCollapsed;
  });

  const [highlight, setHighlight] = useState(false);
  const sectionRef = useRef(null);

  // Listen for global "reveal me" events from the search overlay. When our
  // key is the target, uncollapse, scroll into view, and flash the section.
  useEffect(() => {
    if (!collapsibleKey) return undefined;
    const handler = (event) => {
      if (event.detail?.panel !== collapsibleKey) return;
      setCollapsed(false);
      prefSet(`panel-collapsed:${collapsibleKey}`, false);
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlight(true);
      window.setTimeout(() => setHighlight(false), 1400);
    };
    window.addEventListener(REVEAL_EVENT, handler);
    return () => window.removeEventListener(REVEAL_EVENT, handler);
  }, [collapsibleKey]);

  const toggle = () => {
    setCollapsed((value) => {
      const next = !value;
      if (collapsibleKey) prefSet(`panel-collapsed:${collapsibleKey}`, next);
      return next;
    });
  };

  const bodyId = collapsibleKey ? `panel-body-${collapsibleKey}` : undefined;

  return (
    <section
      ref={sectionRef}
      data-panel-key={collapsibleKey}
      className={cx(styles.panel, {
        [styles.collapsed]: collapsed,
        [styles.highlight]: highlight,
      })}
    >
      <header className={styles.header}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && !collapsed && (
          <div className={styles.actions}>{actions}</div>
        )}
        {collapsibleKey && (
          <Button
            kind="ghost"
            size="sm"
            iconOnly
            className={styles.collapseToggle}
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            aria-label={collapsed ? `Show ${title}` : `Hide ${title}`}
          >
            <IconChevron
              className={cx(styles.collapseChevron, {
                [styles.collapseChevronCollapsed]: collapsed,
              })}
            />
          </Button>
        )}
      </header>
      {!collapsed && (
        <div className={styles.body} id={bodyId}>
          {error ? (
            <div className={styles.error} role="alert">
              <p className={styles.errorTitle}>The archive could not be reached</p>
              <p className={styles.errorText}>
                {error.message || 'Something went wrong while loading this page.'}
              </p>
              {onRetry && (
                <Button kind="ghost" size="sm" onClick={onRetry}>
                  Try again
                </Button>
              )}
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
};

export default Panel;
