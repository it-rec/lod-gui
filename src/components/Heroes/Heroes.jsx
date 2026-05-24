import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import HeroCard from './HeroCard';
import { IconParty, IconPlus, IconRest } from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';
import { toast } from '../common/Toast/toastStore';
import {
  createHero,
  normalizeHeroes,
  SPECIES,
  BACKGROUNDS,
  SKILLS,
  MAX_PARTY,
} from '../character';
import styles from './Heroes.module.scss';

// A stable seed party shown before anything has been saved for this game.
const DEFAULT_PARTY = normalizeHeroes();

const PHASE_IDS = ['morning', 'afternoon', 'evening', 'night'];

const Heroes = () => {
  const {
    value: heroes,
    save,
    loading,
    error,
    reload,
  } = useGameChannel({
    channel: collections.HEROES,
    path: '/api/game/1/heroes/',
    initial: DEFAULT_PARTY,
    fromServer: (raw) => normalizeHeroes(raw?.heroes ?? raw),
    toServer: (list) => ({ heroes: list }),
  });

  // The rest action also advances the calendar, so subscribe to that channel
  // here too. Both Calendar and Heroes can listen to the same channel safely —
  // saves are broadcast and each hook keeps its own copy in sync.
  const { value: calendar, save: saveCalendar } = useGameChannel({
    channel: collections.CALENDAR,
    path: '/api/game/1/calendar/',
    initial: { day: 1, time: 'morning' },
    fromServer: (raw) => ({
      day: Number.isFinite(raw?.day) && raw.day > 0 ? Math.round(raw.day) : 1,
      time: PHASE_IDS.includes(raw?.time) ? raw.time : 'morning',
    }),
  });

  const namedCount = heroes.filter((hero) => hero.name.trim()).length;
  const woundedCount = heroes.filter(
    (hero) => hero.stamina.current < hero.stamina.max
  ).length;

  const updateHero = (id, updated) =>
    save(heroes.map((hero) => (hero.id === id ? updated : hero)));

  const removeHero = (id) => save(heroes.filter((hero) => hero.id !== id));

  const addHero = () => save([...heroes, createHero()]);

  // Restores every hero to full stamina and rolls the calendar to the next
  // morning. Conditions are left alone — they are story state, not wounds.
  const restParty = () => {
    save(
      heroes.map((hero) => ({
        ...hero,
        stamina: { ...hero.stamina, current: hero.stamina.max },
      }))
    );
    saveCalendar({ day: calendar.day + 1, time: 'morning' });
    toast.success(
      'The party rests',
      `Stamina restored. Day ${calendar.day + 1} dawns.`,
      'party-rest'
    );
  };

  return (
    <Panel
      icon={<IconParty />}
      title="The Party"
      subtitle={
        loading
          ? 'Gathering the company…'
          : `${namedCount} of ${heroes.length} heroes named`
      }
      error={error}
      onRetry={reload}
      actions={
        !loading && (
          <div className={styles.actions}>
            <Button
              kind="ghost"
              size="sm"
              onClick={restParty}
              disabled={woundedCount === 0}
              aria-label="Rest the party"
              title={
                woundedCount === 0
                  ? 'The party is already at full strength.'
                  : 'Restore stamina and advance to the next morning.'
              }
            >
              <IconRest />
              Long rest
            </Button>
            <Button
              kind="gold"
              size="sm"
              onClick={addHero}
              disabled={heroes.length >= MAX_PARTY}
            >
              <IconPlus />
              Add hero
            </Button>
          </div>
        )
      }
    >
      <datalist id="lod-species">
        {SPECIES.map((species) => (
          <option key={species} value={species} />
        ))}
      </datalist>
      <datalist id="lod-backgrounds">
        {BACKGROUNDS.map((background) => (
          <option key={background} value={background} />
        ))}
      </datalist>
      <datalist id="lod-skills">
        {SKILLS.map((skill) => (
          <option key={skill} value={skill} />
        ))}
      </datalist>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height="12rem" />
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {heroes.map((hero) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              canRemove={heroes.length > 1}
              onChange={(updated) => updateHero(hero.id, updated)}
              onRemove={() => removeHero(hero.id)}
            />
          ))}
        </div>
      )}
    </Panel>
  );
};

export default Heroes;
