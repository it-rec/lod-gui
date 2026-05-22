import Button from '../Button/Button';
import styles from './Panel.module.scss';

// A framed section of the campaign ledger: a crimson title bar over a
// parchment body. Renders a uniform error/retry state when `error` is set.
const Panel = ({ icon, title, subtitle, actions, error, onRetry, children }) => (
  <section className={styles.panel}>
    <header className={styles.header}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <div className={styles.heading}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
    <div className={styles.body}>
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
  </section>
);

export default Panel;
