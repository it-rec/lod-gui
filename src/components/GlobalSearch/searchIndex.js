import { collections, gamePath } from '../../shared';
import { get } from '../../utils/networkUtils';
import { cacheGet } from '../../utils/localStorageUtil';

// Every channel that the global finder pulls from. The reader functions take
// the raw stored payload and yield `{ id, label, category, detail, target }`
// records for the searcher. The `target` is what `goTo(target)` consumes to
// reveal the matching panel.

const safeArray = (raw, key) =>
  Array.isArray(raw) ? raw : Array.isArray(raw?.[key]) ? raw[key] : [];

const fromQuests = (raw) =>
  safeArray(raw, 'quests')
    .map((entry, index) => {
      const title = typeof entry?.title === 'string' ? entry.title : null;
      if (!title?.trim()) return null;
      const isDone = Boolean(entry?.isDone);
      return {
        id: entry?.id || `quest-${index}`,
        label: title.trim(),
        category: 'Quest',
        detail: typeof entry?.notes === 'string' ? entry.notes : '',
        meta: isDone ? 'completed' : 'active',
        target: { panel: 'quests' },
      };
    })
    .filter(Boolean);

const fromNpcs = (raw) =>
  safeArray(raw, 'npcs')
    .map((entry, index) => {
      const name = typeof entry?.name === 'string' ? entry.name : null;
      if (!name?.trim()) return null;
      return {
        id: entry?.id || `npc-${index}`,
        label: name.trim(),
        category: 'Person',
        detail: typeof entry?.notes === 'string' ? entry.notes : '',
        meta:
          typeof entry?.location === 'string' && entry.location.trim()
            ? entry.location.trim()
            : typeof entry?.role === 'string'
              ? entry.role
              : '',
        target: { panel: 'people' },
      };
    })
    .filter(Boolean);

const fromLocations = (raw) =>
  safeArray(raw, 'locations')
    .map((entry, index) => {
      const name = typeof entry?.name === 'string' ? entry.name : null;
      if (!name?.trim()) return null;
      return {
        id: entry?.id || `loc-${index}`,
        label: name.trim(),
        category: 'Location',
        detail: typeof entry?.notes === 'string' ? entry.notes : '',
        meta:
          typeof entry?.region === 'string' && entry.region.trim()
            ? entry.region.trim()
            : typeof entry?.status === 'string'
              ? entry.status
              : '',
        target: { panel: 'locations' },
      };
    })
    .filter(Boolean);

const fromKeywords = (raw) =>
  safeArray(raw, 'keywords')
    .map((entry, index) => {
      const text = typeof entry?.text === 'string' ? entry.text : null;
      if (!text?.trim()) return null;
      return {
        id: entry?.id || `kw-${index}`,
        label: text.trim(),
        category: 'Keyword',
        detail: '',
        meta: '',
        target: { panel: 'keywords' },
      };
    })
    .filter(Boolean);

const fromJournal = (raw) =>
  safeArray(raw, 'entries')
    .map((entry, index) => {
      const text = typeof entry?.text === 'string' ? entry.text : null;
      if (!text?.trim()) return null;
      const day = Number.isFinite(entry?.day) ? entry.day : null;
      // First line becomes the label, rest stays as detail context.
      const trimmed = text.trim();
      const firstLine = trimmed.split('\n')[0];
      return {
        id: entry?.id || `jnl-${index}`,
        label: firstLine,
        category: 'Journal',
        detail: trimmed.length > firstLine.length ? trimmed.slice(firstLine.length).trim() : '',
        meta: day ? `Day ${day}` : '',
        target: { panel: 'journal' },
      };
    })
    .filter(Boolean);

const SOURCES = [
  { collection: collections.QUESTS, path: gamePath('quests'), reader: fromQuests },
  { collection: collections.NPCS, path: gamePath('npcs'), reader: fromNpcs },
  { collection: collections.LOCATIONS, path: gamePath('locations'), reader: fromLocations },
  { collection: collections.KEYWORDS, path: gamePath('keywords'), reader: fromKeywords },
  { collection: collections.JOURNAL, path: gamePath('journal'), reader: fromJournal },
];

// Builds a single flat list of every searchable record across the campaign.
// Reads first from the localStorage cache (instant) then re-fetches from the
// server so the index is correct even on a cold start.
export const buildSearchIndex = async () => {
  const results = await Promise.all(
    SOURCES.map(async ({ collection, path, reader }) => {
      // Optimistic: start from the cache if there is one.
      const cached = cacheGet(collection);
      let live;
      try {
        live = await get(path);
      } catch {
        live = null;
      }
      const raw = live ?? cached;
      return reader(raw);
    })
  );
  return results.flat();
};

// Score a single record against the query. Higher is better; null filters out.
// Designed to be cheap — no regex compilation per call — and to prefer prefix
// and exact matches over substring matches inside the body.
export const scoreRecord = (record, query) => {
  if (!query) return null;
  const needle = query.trim().toLowerCase();
  if (!needle) return null;

  const label = record.label.toLowerCase();
  const detail = (record.detail || '').toLowerCase();
  const meta = (record.meta || '').toLowerCase();

  if (label === needle) return 100;
  if (label.startsWith(needle)) return 80;
  const labelIndex = label.indexOf(needle);
  if (labelIndex !== -1) return 60 - Math.min(labelIndex, 20);
  if (meta.includes(needle)) return 30;
  if (detail.includes(needle)) return 20;
  return null;
};

export const searchRecords = (records, query, limit = 25) => {
  if (!query || !query.trim()) return [];
  const scored = records
    .map((record) => {
      const score = scoreRecord(record, query);
      return score == null ? null : { score, record };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ record }) => record);
  return scored;
};
