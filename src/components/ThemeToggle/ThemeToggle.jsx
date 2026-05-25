import Button from '../common/Button/Button';
import { IconSun, IconMoon } from '../common/icons';
import { useTheme } from '../../hooks/useTheme';
import styles from './ThemeToggle.module.scss';

const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Button
      kind="ghost"
      size="sm"
      iconOnly
      onClick={toggle}
      aria-label={isDark ? 'Switch to parchment theme' : 'Switch to candlelight theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className={styles.toggle}
    >
      <span className={styles.icon} aria-hidden="true">
        {isDark ? <IconSun /> : <IconMoon />}
      </span>
    </Button>
  );
};

export default ThemeToggle;
