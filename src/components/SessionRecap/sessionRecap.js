// Pure summarisation — given the campaign panels, produce a structured
// recap. Kept side-effect-free so it can be unit-tested directly and so
// the React layer is a thin shell.

const PHASE_LABEL = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

const safeArray = (x) => (Array.isArray(x) ? x : []);

const countBy = (list, predicate) => list.reduce((n, x) => (predicate(x) ? n + 1 : n), 0);

export const summariseRecap = ({
  calendar = { day: 1, time: 'morning', adventure: '' },
  gold = 0,
  fame = 0,
  heroes = [],
  quests = [],
  npcs = [],
  locations = [],
  journal = [],
  recentJournalLimit = 5,
} = {}) => {
  const namedHeroes = safeArray(heroes)
    .filter((h) => h && typeof h.name === 'string' && h.name.trim())
    .map((h) => h.name.trim());

  const questsList = safeArray(quests);
  const activeQuests = countBy(questsList, (q) => !q?.isDone);
  const completedQuests = countBy(questsList, (q) => Boolean(q?.isDone));

  const npcsList = safeArray(npcs);
  const allies = countBy(npcsList, (n) => n?.role === 'ally');
  const foes = countBy(npcsList, (n) => n?.role === 'foe');

  const locationsList = safeArray(locations);
  const visited = countBy(locationsList, (l) => l?.status === 'visited' || l?.status === 'home');
  const rumored = countBy(locationsList, (l) => l?.status === 'rumored');

  const recentJournal = safeArray(journal)
    .slice(0, Math.max(0, recentJournalLimit));

  return {
    adventure: typeof calendar.adventure === 'string' && calendar.adventure.trim()
      ? calendar.adventure.trim()
      : 'Untitled tale',
    day: Number.isFinite(calendar.day) ? calendar.day : 1,
    timeLabel: PHASE_LABEL[calendar.time] || 'Morning',
    party: namedHeroes,
    counts: {
      gold: Number.isFinite(gold) ? gold : 0,
      fame: Number.isFinite(fame) ? fame : 0,
      questsActive: activeQuests,
      questsCompleted: completedQuests,
      allies,
      foes,
      npcsTotal: npcsList.length,
      locationsVisited: visited,
      locationsRumored: rumored,
      locationsTotal: locationsList.length,
    },
    recentJournal,
  };
};

const formatJournalLine = (entry) => {
  const day = Number.isFinite(entry?.day) ? entry.day : '?';
  const time = PHASE_LABEL[entry?.time] || '';
  const stamp = time ? `Day ${day}, ${time}` : `Day ${day}`;
  const text = typeof entry?.text === 'string' ? entry.text.trim() : '';
  return `- ${stamp} — ${text}`;
};

export const recapToText = (recap) => {
  const lines = [];
  lines.push(`# ${recap.adventure}`);
  lines.push(`Day ${recap.day}, ${recap.timeLabel}`);
  if (recap.party.length) lines.push(`Party: ${recap.party.join(', ')}`);
  lines.push('');
  lines.push(`Gold: ${recap.counts.gold}    Fame: ${recap.counts.fame}`);
  lines.push(
    `Quests: ${recap.counts.questsActive} active, ${recap.counts.questsCompleted} done`
  );
  lines.push(
    `People: ${recap.counts.npcsTotal} total (${recap.counts.allies} allies, ${recap.counts.foes} foes)`
  );
  lines.push(
    `Locations: ${recap.counts.locationsTotal} total (${recap.counts.locationsVisited} visited, ${recap.counts.locationsRumored} rumored)`
  );
  if (recap.recentJournal.length) {
    lines.push('');
    lines.push('Recent journal:');
    for (const entry of recap.recentJournal) {
      lines.push(formatJournalLine(entry));
    }
  }
  return lines.join('\n');
};
