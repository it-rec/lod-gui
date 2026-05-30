import { collections, gamePath } from '../../shared';
import { get, post } from '../../utils/networkUtils';

const ENDPOINTS = [
  { key: collections.HEROES, path: gamePath('heroes') },
  { key: collections.GOLD, path: gamePath('gold') },
  { key: collections.FAME, path: gamePath('fame') },
  { key: collections.CALENDAR, path: gamePath('calendar') },
  { key: collections.KEYWORDS, path: gamePath('keywords') },
  { key: collections.QUESTS, path: gamePath('quests') },
  { key: collections.NPCS, path: gamePath('npcs') },
  { key: collections.LOCATIONS, path: gamePath('locations') },
  { key: collections.JOURNAL, path: gamePath('journal') },
  { key: collections.INITIATIVE, path: gamePath('initiative') },
  { key: collections.INVENTORY, path: gamePath('inventory') },
  { key: collections.STORY_POINTS, path: gamePath('storyPoints') },
];

export const BACKUP_VERSION = 1;

export const buildBackup = async () => {
  const entries = await Promise.all(
    ENDPOINTS.map(async ({ key, path }) => [key, await get(path)])
  );
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    game: 1,
    data: Object.fromEntries(entries),
  };
};

const ALLOWED_KEYS = new Set(ENDPOINTS.map(({ key }) => key));

export const restoreBackup = async (backup) => {
  if (!backup || typeof backup !== 'object' || !backup.data) {
    throw new Error('That file does not look like a campaign backup.');
  }
  if (backup.version !== BACKUP_VERSION) {
    throw new Error(
      `Backup version ${backup.version} is not supported (expected ${BACKUP_VERSION}).`
    );
  }
  const writes = ENDPOINTS.filter(({ key }) =>
    Object.prototype.hasOwnProperty.call(backup.data, key) &&
    ALLOWED_KEYS.has(key)
  ).map(({ key, path }) => post(path, backup.data[key] ?? null));
  await Promise.all(writes);
};

export const filenameForBackup = (now = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `lod-campaign-${stamp}.json`;
};
