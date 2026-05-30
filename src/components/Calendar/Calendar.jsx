import cx from 'classnames';
import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import TextInput from '../common/TextInput/TextInput';
import {
  IconCalendar,
  IconSun,
  IconSunset,
  IconMoon,
  IconPlus,
  IconMinus,
} from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections, gamePath } from '../../shared';
import styles from './Calendar.module.scss';

const PHASES = [
  { id: 'morning', label: 'Morning', icon: <IconSunset /> },
  { id: 'afternoon', label: 'Afternoon', icon: <IconSun /> },
  { id: 'evening', label: 'Evening', icon: <IconSunset /> },
  { id: 'night', label: 'Night', icon: <IconMoon /> },
];
const PHASE_IDS = PHASES.map((phase) => phase.id);
const INITIAL = { day: 1, time: 'morning', adventure: '' };

const Calendar = () => {
  const { value, save, loading, error, reload } = useGameChannel({
    channel: collections.CALENDAR,
    path: gamePath('calendar'),
    initial: INITIAL,
    fromServer: (raw) => ({
      day: Number.isFinite(raw?.day) && raw.day > 0 ? Math.round(raw.day) : 1,
      time: PHASE_IDS.includes(raw?.time) ? raw.time : 'morning',
      adventure: typeof raw?.adventure === 'string' ? raw.adventure : '',
    }),
  });

  const setDay = (day) => save({ ...value, day: Math.max(1, day) });

  // Advancing past Night rolls over into the morning of the next day.
  const advance = () => {
    const index = PHASE_IDS.indexOf(value.time);
    if (index === PHASE_IDS.length - 1) {
      save({ day: value.day + 1, time: PHASE_IDS[0] });
    } else {
      save({ ...value, time: PHASE_IDS[index + 1] });
    }
  };

  return (
    <Panel
      icon={<IconCalendar />}
      title="The Calendar"
      subtitle="The passage of time"
      error={error}
      onRetry={reload}
    >
      {loading ? (
        <Skeleton height="10rem" />
      ) : (
        <div className={styles.calendar}>
          <label className={styles.adventure}>
            <span className={styles.adventureLabel}>Current adventure</span>
            <TextInput
              variant="sm"
              value={value.adventure}
              placeholder="Untitled tale"
              aria-label="Current adventure"
              onChange={(event) => save({ ...value, adventure: event.target.value })}
            />
          </label>

          <div className={styles.dayBlock}>
            <span className={styles.dayLabel}>Day</span>
            <div className={styles.dayControls}>
              <Button
                kind="ghost"
                size="sm"
                iconOnly
                disabled={value.day <= 1}
                onClick={() => setDay(value.day - 1)}
                aria-label="Previous day"
              >
                <IconMinus />
              </Button>
              <span className={styles.dayValue}>{value.day}</span>
              <Button
                kind="gold"
                size="sm"
                iconOnly
                onClick={() => setDay(value.day + 1)}
                aria-label="Next day"
              >
                <IconPlus />
              </Button>
            </div>
          </div>

          <div className={styles.phases} role="group" aria-label="Time of day">
            {PHASES.map((phase) => (
              <button
                key={phase.id}
                type="button"
                className={cx(styles.phase, {
                  [styles.phaseActive]: value.time === phase.id,
                })}
                onClick={() => save({ ...value, time: phase.id })}
                aria-pressed={value.time === phase.id}
              >
                <span className={styles.phaseIcon}>{phase.icon}</span>
                <span className={styles.phaseLabel}>{phase.label}</span>
              </button>
            ))}
          </div>

          <Button kind="primary" className={styles.advance} onClick={advance}>
            Advance time
          </Button>
        </div>
      )}
    </Panel>
  );
};

export default Calendar;
