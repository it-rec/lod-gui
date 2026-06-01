import Crest from '../common/Crest/Crest';
import ConnectionBadge from '../common/ConnectionBadge/ConnectionBadge';
import CampaignMenu from '../CampaignMenu/CampaignMenu';
import DiceRoller from '../DiceRoller/DiceRoller';
import GmNotebook from '../GmNotebook/GmNotebook';
import LoreGenerator from '../LoreGenerator/LoreGenerator';
import Soundscape from '../Soundscape/Soundscape';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import SessionTimer from '../SessionTimer/SessionTimer';
import PlayerBadge from '../PlayerBadge/PlayerBadge';
import OverflowMenu from '../OverflowMenu/OverflowMenu';
import { GlobalSearchButton } from '../GlobalSearch/GlobalSearch';
import { QuestLogButton } from '../QuestLog/QuestLog';
import { KeyboardHelpButton } from '../KeyboardHelp/KeyboardHelp';
import styles from './AppHeader.module.scss';

const AppHeader = () => (
  <header className={styles.header}>
    <div className={styles.inner}>
      <div className={styles.brand}>
        <Crest className={styles.crest} />
        <div className={styles.titles}>
          <h1 className={styles.title}>LoD</h1>
          <p className={styles.subtitle}>Campaign Companion</p>
        </div>
      </div>
      <div className={styles.tools}>
        <ConnectionBadge />
        <PlayerBadge />
        <SessionTimer />
        {/* Reachable from the overflow menu on small screens, so hide the
            standalone buttons there to keep the toolbar from spilling. */}
        <span className={styles.collapsible}>
          <GlobalSearchButton />
        </span>
        <span className={styles.collapsible}>
          <QuestLogButton />
        </span>
        <DiceRoller />
        <LoreGenerator />
        <Soundscape />
        <GmNotebook />
        <ThemeToggle />
        <span className={styles.collapsible}>
          <KeyboardHelpButton />
        </span>
        <OverflowMenu />
        <CampaignMenu />
      </div>
    </div>
  </header>
);

export default AppHeader;
