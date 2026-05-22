// The hero (character) model and helpers for normalising stored party data.

export const MAX_PARTY = 6;
export const DEFAULT_PARTY_SIZE = 4;
export const DEFAULT_STAMINA = 10;

// Suggestions offered through <datalist> on the race/class inputs. They are
// only hints — any free-text value is allowed for homebrew settings.
export const RACES = [
  'Human',
  'Elf',
  'Dwarf',
  'Halfling',
  'Gnome',
  'Half-Orc',
  'Tiefling',
  'Dragonborn',
  'Orc',
  'Aasimar',
];

export const CLASSES = [
  'Warrior',
  'Mage',
  'Rogue',
  'Cleric',
  'Ranger',
  'Paladin',
  'Bard',
  'Druid',
  'Barbarian',
  'Sorcerer',
  'Monk',
  'Warlock',
];

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `hero-${Math.random().toString(36).slice(2, 10)}`;

export const createHero = (overrides = {}) => ({
  id: uid(),
  name: '',
  race: '',
  class: '',
  level: 1,
  stamina: { current: DEFAULT_STAMINA, max: DEFAULT_STAMINA },
  skills: [],
  items: [],
  notes: '',
  ...overrides,
});

// Upgrades a single stored entry — which may be a legacy plain name string or
// a partial object — into a complete hero.
export const normalizeHero = (raw) => {
  if (typeof raw === 'string') return createHero({ name: raw });
  if (!raw || typeof raw !== 'object') return createHero();

  const stamina = raw.stamina || {};
  const max =
    Number.isFinite(stamina.max) && stamina.max > 0
      ? Math.round(stamina.max)
      : DEFAULT_STAMINA;
  const current = Number.isFinite(stamina.current)
    ? Math.round(stamina.current)
    : max;

  return {
    ...createHero(),
    ...(raw.id ? { id: raw.id } : {}),
    name: typeof raw.name === 'string' ? raw.name : '',
    race: typeof raw.race === 'string' ? raw.race : '',
    class: typeof raw.class === 'string' ? raw.class : '',
    level: Number.isFinite(raw.level) ? Math.max(1, Math.round(raw.level)) : 1,
    stamina: { current: Math.max(0, Math.min(current, max)), max },
    skills: Array.isArray(raw.skills)
      ? raw.skills.filter((skill) => typeof skill === 'string' && skill.trim())
      : [],
    items: Array.isArray(raw.items)
      ? raw.items
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          name: typeof item.name === 'string' ? item.name : '',
          amount: Number.isFinite(item.amount) ? Math.round(item.amount) : 1,
        }))
      : [],
    notes: typeof raw.notes === 'string' ? raw.notes : '',
  };
};

// Normalises the whole stored party, seeding a default party when empty.
export const normalizeHeroes = (rawList) => {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return Array.from({ length: DEFAULT_PARTY_SIZE }, () => createHero());
  }
  return rawList.slice(0, MAX_PARTY).map(normalizeHero);
};
