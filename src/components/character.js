// The hero (character) model for Legacy of Dragonholt and helpers for
// normalising stored party data — including migration from the older shape.

export const MAX_PARTY = 6;
export const DEFAULT_PARTY_SIZE = 4;
export const DEFAULT_STAMINA = 10;
export const MAX_SKILL_RANK = 6;

// Suggestions offered through <datalist>. They are only autocomplete hints —
// any free-text value is accepted.
export const SPECIES = ['Human', 'Elf', 'Dwarf', 'Orc', 'Catfolk'];

export const BACKGROUNDS = [
  'Soldier',
  'Scholar',
  'Healer',
  'Outlaw',
  'Performer',
  'Noble',
  'Hunter',
  'Merchant',
  'Mystic',
  'Wanderer',
];

export const SKILLS = [
  'Athletics',
  'Bartering',
  'Coordination',
  'Healing',
  'Intimidation',
  'Intuition',
  'Logic',
  'Lore',
  'Observation',
  'Performance',
  'Persuasion',
  'Stealth',
];

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `hero-${Math.random().toString(36).slice(2, 10)}`;

export const createHero = (overrides = {}) => ({
  id: uid(),
  name: '',
  species: '',
  background: '',
  stamina: { current: DEFAULT_STAMINA, max: DEFAULT_STAMINA },
  skills: [],
  traits: [],
  conditions: [],
  items: [],
  notes: '',
  ...overrides,
});

const normalizeSkill = (raw) => {
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { name, rank: 1 } : null;
  }
  if (raw && typeof raw === 'object' && typeof raw.name === 'string' && raw.name.trim()) {
    const rank = Number.isFinite(raw.rank) ? Math.round(raw.rank) : 1;
    return { name: raw.name.trim(), rank: Math.max(1, Math.min(rank, MAX_SKILL_RANK)) };
  }
  return null;
};

const stringList = (value) =>
  Array.isArray(value)
    ? value.filter((entry) => typeof entry === 'string' && entry.trim())
    : [];

// Upgrades a single stored entry — a legacy name string, a legacy object with
// `race`/`class`/`level`, or a current hero object — into a complete hero.
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
    species:
      typeof raw.species === 'string'
        ? raw.species
        : typeof raw.race === 'string'
          ? raw.race
          : '',
    background:
      typeof raw.background === 'string'
        ? raw.background
        : typeof raw.class === 'string'
          ? raw.class
          : '',
    stamina: { current: Math.max(0, Math.min(current, max)), max },
    skills: Array.isArray(raw.skills)
      ? raw.skills.map(normalizeSkill).filter(Boolean)
      : [],
    traits: stringList(raw.traits),
    conditions: stringList(raw.conditions),
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
