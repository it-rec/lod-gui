import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/networkUtils', () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { get, post } from '../../utils/networkUtils';
import {
  BACKUP_VERSION,
  buildBackup,
  filenameForBackup,
  restoreBackup,
} from './campaignBackup';

describe('campaignBackup', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('builds a versioned backup with every channel', async () => {
    get.mockImplementation((path) => Promise.resolve({ path }));

    const backup = await buildBackup();

    expect(backup.version).toBe(BACKUP_VERSION);
    expect(typeof backup.exportedAt).toBe('string');
    expect(backup.data).toEqual(
      expect.objectContaining({
        heroes: expect.any(Object),
        gold: expect.any(Object),
        fame: expect.any(Object),
        calendar: expect.any(Object),
        keywords: expect.any(Object),
        quests: expect.any(Object),
        npcs: expect.any(Object),
        locations: expect.any(Object),
        journal: expect.any(Object),
        initiative: expect.any(Object),
        storyPoints: expect.any(Object),
      })
    );
    expect(get).toHaveBeenCalledTimes(11);
  });

  it('restores by posting every channel back', async () => {
    post.mockResolvedValue(null);
    await restoreBackup({
      version: BACKUP_VERSION,
      data: {
        heroes: { heroes: [] },
        gold: { gold: 42 },
        fame: { fame: 3 },
        calendar: { day: 5, time: 'evening' },
        keywords: { keywords: [] },
        quests: { quests: [] },
        npcs: { npcs: [] },
        locations: { locations: [] },
        journal: { entries: [] },
        initiative: { combatants: [], round: 1, currentId: null },
        storyPoints: [],
      },
    });
    expect(post).toHaveBeenCalledTimes(11);
    expect(post).toHaveBeenCalledWith('/api/game/1/gold/', { gold: 42 });
    expect(post).toHaveBeenCalledWith('/api/game/1/calendar/', {
      day: 5,
      time: 'evening',
    });
  });

  it('rejects unknown payload shapes', async () => {
    await expect(restoreBackup(null)).rejects.toThrow(/backup/i);
    await expect(restoreBackup({ data: {} })).rejects.toThrow(/version/i);
    await expect(
      restoreBackup({ version: BACKUP_VERSION + 9, data: {} })
    ).rejects.toThrow(/version/i);
  });

  it('skips channels that the backup does not include', async () => {
    post.mockResolvedValue(null);
    await restoreBackup({
      version: BACKUP_VERSION,
      data: { gold: { gold: 7 } },
    });
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/api/game/1/gold/', { gold: 7 });
  });

  it('formats a timestamped backup filename', () => {
    const stamp = filenameForBackup(new Date('2025-08-09T14:05:00'));
    expect(stamp).toBe('lod-campaign-20250809-1405.json');
  });
});
