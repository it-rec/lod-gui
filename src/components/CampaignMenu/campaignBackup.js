import { collections } from '../../shared';
import { get, post } from '../../utils/networkUtils';

const ENDPOINTS = [
  { key: collections.HEROES, path: '/api/game/1/heroes/' },
  { key: collections.GOLD, path: '/api/game/1/gold/' },
  { key: collections.FAME, path: '/api/game/1/fame/' },
  { key: collections.CALENDAR, path: '/api/game/1/calendar/' },
  { key: collections.KEYWORDS, path: '/api/game/1/keywords/' },
  { key: collections.QUESTS, path: '/api/game/1/quests/' },
  { key: collections.NPCS, path: '/api/game/1/npcs/' },
  { key: collections.LOCATIONS, path: '/api/game/1/locations/' },
  { key: collections.JOURNAL, path: '/api/game/1/journal/' },
  { key: collections.INITIATIVE, path: '/api/game/1/initiative/' },
  { key: collections.INVENTORY, path: '/api/game/1/inventory/' },
  { key: collections.STORY_POINTS, path: '/api/game/1/storyPoints/' },
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
