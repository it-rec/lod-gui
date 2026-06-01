import Quests from './components/Quests/Quests';
import NPCs from './components/NPCs/NPCs';
import Locations from './components/Locations/Locations';
import Keywords from './components/Keywords/Keywords';
import {
  IconParty,
  IconQuest,
  IconPeople,
  IconMap,
  IconKey,
  IconSword,
  IconChest,
  IconScroll,
  IconCalendar,
} from './components/common/icons';

// The four story ledgers in the "notebook" grid that a player can rearrange.
// `key` matches each panel's `collapsibleKey`, so it doubles as the reveal /
// jump target and the persisted-order identity.
export const NOTEBOOK_PANELS = [
  { key: 'quests', label: 'Quests', Component: Quests },
  { key: 'people', label: 'People', Component: NPCs },
  { key: 'locations', label: 'Locations', Component: Locations },
  { key: 'keywords', label: 'Keywords', Component: Keywords },
];

// Every panel the section nav can jump to, in page order. Keys match the
// panels' `collapsibleKey` so a jump reuses the same reveal event the global
// search uses (uncollapse + scroll + flash). The small Gold/Fame/Calendar
// ledger cards are intentionally omitted — they sit together at the top.
export const JUMP_SECTIONS = [
  { key: 'party', label: 'The Party', Icon: IconParty },
  { key: 'quests', label: 'Quests', Icon: IconQuest },
  { key: 'people', label: 'People', Icon: IconPeople },
  { key: 'locations', label: 'Locations', Icon: IconMap },
  { key: 'keywords', label: 'Keywords', Icon: IconKey },
  { key: 'initiative', label: 'Initiative', Icon: IconSword },
  { key: 'inventory', label: 'Inventory', Icon: IconChest },
  { key: 'journal', label: 'Journal', Icon: IconScroll },
  { key: 'chronicle', label: 'The Chronicle', Icon: IconCalendar },
];
