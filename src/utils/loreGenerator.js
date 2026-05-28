// Stock word tables for the Lore Generator. Kept terse on purpose — these
// aren't an LoD-specific name pool, they're a quick way to break a creative
// block at the table. Add or trim freely.

const TAVERN_QUALIFIERS = [
  'Crooked', 'Silver', 'Gilded', 'Drunken', 'Weeping', 'Iron', 'Sleeping',
  'Hollow', 'Salted', 'Crimson', 'Wandering', 'Singing', 'Last', 'Black',
  'Velvet', 'Half-Penny', 'Mossy', 'Burnished', 'Hidden', 'Wayward',
];

const TAVERN_SUBJECTS = [
  'Crow', 'Lantern', 'Anvil', 'Chalice', 'Mermaid', 'Stag', 'Coin',
  'Boar', 'Quill', 'Tankard', 'Owl', 'Compass', 'Hound', 'Spire',
  'Saddle', 'Goblet', 'Drake', 'Wheel', 'Falcon', 'Apple',
];

const TAVERN_FRAMES = [
  (q, s) => `The ${q} ${s}`,
  (q, s) => `The ${s} & ${TAVERN_SUBJECTS[(TAVERN_SUBJECTS.indexOf(s) + 1) % TAVERN_SUBJECTS.length]}`,
  (q, s) => `The ${q} ${s} Inn`,
  (q, s) => `${q} ${s} Tavern`,
];

const NPC_FIRST = [
  'Mira', 'Bram', 'Sela', 'Halden', 'Esca', 'Toryn', 'Rowan', 'Ilse',
  'Garen', 'Petra', 'Olwen', 'Jorund', 'Veska', 'Daris', 'Fenra',
  'Kell', 'Aldyn', 'Sorrel', 'Marek', 'Yvette',
];

const NPC_LAST = [
  'Highstone', 'Ashfield', 'Brightwheel', 'Greythorn', 'Vellance',
  'Holloway', 'Marrow', 'Quill', 'Sablebrook', 'Underhill', 'Westmark',
  'Coldwater', 'Pinedown', 'Ashgrove', 'Stormgate', 'Ironvein',
];

const NPC_ROLES = [
  'the herbalist', 'the disgraced knight', 'the fletcher\'s apprentice',
  'the road-warden', 'the silver-tongued courier', 'the reluctant heir',
  'the back-alley alchemist', 'the cartographer', 'the field-cleric',
  'the chandler', 'the pearl-diver', 'the broken sellsword',
  'the toll-house clerk', 'the goat-herd', 'the wandering scholar',
  'the masked envoy', 'the dock-rat turned poet', 'the bone-setter',
];

const WEATHER_SKY = [
  'A flat grey sky',
  'Bright, cloudless sun',
  'A thin overcast',
  'Heavy iron clouds',
  'A bruised purple dusk-light',
  'A pale, washed-out morning',
  'A high, hard-edged blue',
  'A streaky, racing wrack of cloud',
];

const WEATHER_GROUND = [
  'and dry roads underfoot.',
  'with mud halfway to the knee.',
  'and a steady, thin rain.',
  'and the first dry leaves blowing.',
  'with frost still in the hollows.',
  'and a wind off the open water.',
  'with the smell of woodsmoke from a village somewhere.',
  'and a faint mist that won\'t lift.',
];

export const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

export const generateTavern = (rng = Math.random) => {
  const qualifier = pick(TAVERN_QUALIFIERS, rng);
  const subject = pick(TAVERN_SUBJECTS, rng);
  const frame = pick(TAVERN_FRAMES, rng);
  return frame(qualifier, subject);
};

export const generateNpc = (rng = Math.random) => {
  const first = pick(NPC_FIRST, rng);
  const last = pick(NPC_LAST, rng);
  const role = pick(NPC_ROLES, rng);
  return `${first} ${last}, ${role}`;
};

export const generateWeather = (rng = Math.random) => {
  const sky = pick(WEATHER_SKY, rng);
  const ground = pick(WEATHER_GROUND, rng);
  return `${sky} ${ground}`;
};

export const GENERATORS = {
  tavern: { label: 'Tavern name', generate: generateTavern },
  npc: { label: 'NPC', generate: generateNpc },
  weather: { label: 'Weather', generate: generateWeather },
};
