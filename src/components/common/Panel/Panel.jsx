import { useState } from 'react';
import cx from 'classnames';
import Button from '../Button/Button';
import { IconChevron } from '../icons';
import { prefGet, prefSet } from '../../../utils/localStorageUtil';
import styles from './Panel.module.scss';

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

  const toggle = () => {
    setCollapsed((value) => {
      const next = !value;
      if (collapsibleKey) prefSet(`panel-collapsed:${collapsibleKey}`, next);
      return next;
    });
  };

  const bodyId = collapsibleKey ? `panel-body-${collapsibleKey}` : undefined;

  return (
    <section className={cx(styles.panel, { [styles.collapsed]: collapsed })}>
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
