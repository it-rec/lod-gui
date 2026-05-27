import Crest from '../common/Crest/Crest';
import ConnectionBadge from '../common/ConnectionBadge/ConnectionBadge';
import CampaignMenu from '../CampaignMenu/CampaignMenu';
import DiceRoller from '../DiceRoller/DiceRoller';
import GmNotebook from '../GmNotebook/GmNotebook';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import SessionTimer from '../SessionTimer/SessionTimer';
import PlayerBadge from '../PlayerBadge/PlayerBadge';
import { GlobalSearchButton } from '../GlobalSearch/GlobalSearch';
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
        <GlobalSearchButton />
        <DiceRoller />
        <GmNotebook />
        <ThemeToggle />
        <KeyboardHelpButton />
        <CampaignMenu />
      </div>
    </div>
  </header>
);

export default AppHeader;
