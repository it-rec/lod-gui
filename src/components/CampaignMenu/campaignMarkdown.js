// Converts a full campaign backup into a single Markdown document — readable
// in any editor, printable, and shareable as a session handout.
//
// Designed to be tolerant: any missing channel is simply skipped, and any
// malformed entry is rendered as best-effort. Input shape matches the JSON
// the existing backup format produces:
//
//   {
//     version: 1, exportedAt, game,
//     data: { heroes, quests, npcs, locations, keywords, journal, inventory,
//             initiative, fame, gold, calendar, storyPoints }
//   }

const safeArray = (raw, ...keys) => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    for (const key of keys) {
      if (Array.isArray(raw[key])) return raw[key];
    }
  }
  return [];
};

const safeStr = (value, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const safeNum = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const PHASE_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

const STATUS_LABELS = {
  rumored: 'Rumored',
  visited: 'Visited',
  home: 'Home',
  lost: 'Lost',
};

const ROLE_LABELS = {
  ally: 'Ally',
  foe: 'Foe',
  neutral: 'Neutral',
  unknown: 'Unknown',
};

// Indent multi-line free text under a bullet so it renders cleanly.
const indent = (text, prefix = '  ') =>
  String(text).replace(/\n/g, `\n${prefix}`);

const renderHeroes = (raw) => {
  const list = safeArray(raw, 'heroes');
  if (list.length === 0) return null;
  const rows = list
    .filter((h) => h && typeof h === 'object' && safeStr(h.name).trim())
    .map((hero) => {
      const name = safeStr(hero.name).trim();
      const klass = safeStr(hero.class).trim();
      const level = safeNum(hero.level);
      const xp = safeNum(hero.xp);
      const headline = klass ? `${name} — ${klass}` : name;
      const stats = [];
      if (level) stats.push(`L${level}`);
      if (xp) stats.push(`${xp} XP`);
      const notes = safeStr(hero.notes).trim();
      return [
        `### ${headline}`,
        stats.length ? `_${stats.join(' · ')}_` : '',
        notes ? `\n${notes}\n` : '',
      ]
        .filter(Boolean)
        .join('\n');
    });
  if (rows.length === 0) return null;
  return `## The Party\n\n${rows.join('\n\n')}`;
};

const renderQuests = (raw) => {
  const list = safeArray(raw, 'quests');
  if (list.length === 0) return null;
  const open = list.filter((q) => !q.isDone);
  const done = list.filter((q) => q.isDone);
  const section = (title, items) => {
    if (items.length === 0) return null;
    const bullets = items.map((quest) => {
      const title = safeStr(quest.title).trim();
      const notes = safeStr(quest.notes).trim();
      const deps = Array.isArray(quest.dependsOn) ? quest.dependsOn : [];
      const blockingNames = deps
        .map((id) => list.find((q) => q.id === id))
        .filter((q) => q && !q.isDone)
        .map((q) => safeStr(q.title).trim());
      const lines = [`- **${title}**`];
      if (notes) lines.push(`  ${indent(notes)}`);
      if (blockingNames.length > 0) {
        lines.push(`  _Blocked until: ${blockingNames.join(', ')}_`);
      }
      return lines.join('\n');
    });
    return `### ${title}\n\n${bullets.join('\n')}`;
  };
  return [
    '## Quests',
    section('Active', open),
    section('Completed', done),
  ]
    .filter(Boolean)
    .join('\n\n');
};

const renderNpcs = (raw) => {
  const list = safeArray(raw, 'npcs');
  if (list.length === 0) return null;
  const groups = ['ally', 'foe', 'neutral', 'unknown'];
  const sections = groups
    .map((role) => {
      const items = list.filter((npc) => safeStr(npc.role, 'unknown') === role);
      if (items.length === 0) return null;
      const bullets = items.map((npc) => {
        const name = safeStr(npc.name).trim();
        const location = safeStr(npc.location).trim();
        const notes = safeStr(npc.notes).trim();
        const head = location ? `**${name}** (${location})` : `**${name}**`;
        return notes
          ? `- ${head}\n  ${indent(notes)}`
          : `- ${head}`;
      });
      return `### ${ROLE_LABELS[role]}\n\n${bullets.join('\n')}`;
    })
    .filter(Boolean);
  if (sections.length === 0) return null;
  return `## People\n\n${sections.join('\n\n')}`;
};

const renderLocations = (raw) => {
  const list = safeArray(raw, 'locations');
  if (list.length === 0) return null;
  const groups = ['home', 'visited', 'rumored', 'lost'];
  const sections = groups
    .map((status) => {
      const items = list.filter((loc) => safeStr(loc.status, 'rumored') === status);
      if (items.length === 0) return null;
      const bullets = items.map((loc) => {
        const name = safeStr(loc.name).trim();
        const region = safeStr(loc.region).trim();
        const notes = safeStr(loc.notes).trim();
        const head = region ? `**${name}** — ${region}` : `**${name}**`;
        return notes
          ? `- ${head}\n  ${indent(notes)}`
          : `- ${head}`;
      });
      return `### ${STATUS_LABELS[status]}\n\n${bullets.join('\n')}`;
    })
    .filter(Boolean);
  if (sections.length === 0) return null;
  return `## Places\n\n${sections.join('\n\n')}`;
};

const renderKeywords = (raw) => {
  const list = safeArray(raw, 'keywords');
  if (list.length === 0) return null;
  const words = list
    .map((kw) => (typeof kw === 'string' ? kw : safeStr(kw?.text)).trim())
    .filter(Boolean);
  if (words.length === 0) return null;
  return `## Keywords\n\n${words.map((w) => `- ${w}`).join('\n')}`;
};

const renderJournal = (raw) => {
  const list = safeArray(raw, 'entries');
  if (list.length === 0) return null;
  const byDay = new Map();
  list.forEach((entry) => {
    if (!entry || !safeStr(entry.text).trim()) return;
    const day = safeNum(entry.day, 1);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(entry);
  });
  if (byDay.size === 0) return null;
  const PHASE_ORDER = ['morning', 'afternoon', 'evening', 'night'];
  const days = Array.from(byDay.entries()).sort(([a], [b]) => a - b);
  const sections = days.map(([day, items]) => {
    items.sort((a, b) => {
      const pa = PHASE_ORDER.indexOf(safeStr(a.time));
      const pb = PHASE_ORDER.indexOf(safeStr(b.time));
      return pa - pb;
    });
    const bullets = items.map((entry) => {
      const text = safeStr(entry.text).trim();
      const phase = PHASE_LABELS[safeStr(entry.time)] || '';
      const author = safeStr(entry.author).trim();
      const head = [phase, author].filter(Boolean).join(' · ');
      const prefix = head ? `**${head}**  ` : '';
      return `- ${prefix}${indent(text)}`;
    });
    return `### Day ${day}\n\n${bullets.join('\n')}`;
  });
  return `## Session Journal\n\n${sections.join('\n\n')}`;
};

const renderInventory = (raw) => {
  const list = safeArray(raw, 'items');
  if (list.length === 0) return null;
  const bullets = list
    .filter((item) => item && safeStr(item.name).trim())
    .map((item) => {
      const name = safeStr(item.name).trim();
      const qty = safeNum(item.quantity, 1);
      const holder = safeStr(item.holder).trim();
      const notes = safeStr(item.notes).trim();
      const head = `**${qty}× ${name}**${holder ? ` (${holder})` : ''}`;
      return notes ? `- ${head}\n  ${indent(notes)}` : `- ${head}`;
    });
  if (bullets.length === 0) return null;
  return `## Treasure\n\n${bullets.join('\n')}`;
};

const renderHeaderBlock = (data) => {
  const calendar = data?.calendar || {};
  const day = safeNum(calendar.day, 1);
  const phase = PHASE_LABELS[safeStr(calendar.time, 'morning')] || 'Morning';
  const fame = safeNum(data?.fame?.fame ?? data?.fame);
  const gold = safeNum(data?.gold?.gold ?? data?.gold);
  const heroes = safeArray(data?.heroes, 'heroes').length;
  return [
    `**Day ${day} · ${phase}**`,
    heroes > 0 ? `${heroes} ${heroes === 1 ? 'hero' : 'heroes'}` : null,
    `${fame} fame`,
    `${gold} gold`,
  ]
    .filter(Boolean)
    .join(' · ');
};

// Main entry. Accepts the backup object as produced by buildBackup().
export const campaignToMarkdown = (backup) => {
  const data = backup?.data || {};
  const exportedAt = safeStr(backup?.exportedAt) || new Date().toISOString();
  const date = exportedAt.slice(0, 10);

  const sections = [
    '# Campaign Ledger',
    `_Exported ${date}_`,
    '',
    renderHeaderBlock(data),
    renderHeroes(data.heroes),
    renderQuests(data.quests),
    renderNpcs(data.npcs),
    renderLocations(data.locations),
    renderInventory(data.inventory),
    renderJournal(data.journal),
    renderKeywords(data.keywords),
  ].filter(Boolean);

  return `${sections.join('\n\n')}\n`;
};

export const filenameForMarkdown = (now = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `lod-campaign-${stamp}.md`;
};
