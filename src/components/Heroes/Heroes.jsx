import Panel from '../common/Panel/Panel';
import Skeleton from '../common/Skeleton/Skeleton';
import Button from '../common/Button/Button';
import HeroCard from './HeroCard';
import { IconParty, IconPlus } from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';
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

  const namedCount = heroes.filter((hero) => hero.name.trim()).length;

  const updateHero = (id, updated) =>
    save(heroes.map((hero) => (hero.id === id ? updated : hero)));

  const removeHero = (id) => save(heroes.filter((hero) => hero.id !== id));

  const addHero = () => save([...heroes, createHero()]);

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
          <Button
            kind="gold"
            size="sm"
            onClick={addHero}
            disabled={heroes.length >= MAX_PARTY}
          >
            <IconPlus />
            Add hero
          </Button>
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
