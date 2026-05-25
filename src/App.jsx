import './App.scss';
import { useEffect, useRef } from 'react';
import AppHeader from './components/AppHeader/AppHeader';
import Heroes from './components/Heroes/Heroes';
import Gold from './components/Gold/Gold';
import Fame from './components/Fame/Fame';
import Calendar from './components/Calendar/Calendar';
import Keywords from './components/Keywords/Keywords';
import Quests from './components/Quests/Quests';
import NPCs from './components/NPCs/NPCs';
import Locations from './components/Locations/Locations';
import Journal from './components/Journal/Journal';
import StoryPoints from './components/StoryPoints/StoryPoints';
import GlobalSearch from './components/GlobalSearch/GlobalSearch';
import KeyboardHelp from './components/KeyboardHelp/KeyboardHelp';
import Toaster from './components/common/Toast/Toaster';
import { useConnection } from './hooks/useConnection';
import { toast } from './components/common/Toast/toastStore';

const App = () => {
  const status = useConnection();
  const previousStatus = useRef(status);

  // Announce realtime link drops and recoveries (but not the first connect).
  useEffect(() => {
    const previous = previousStatus.current;
    if (previous === status) return;
    if (status === 'disconnected' && previous === 'connected') {
      toast.error(
        'Connection lost',
        'Your edits are kept locally until the link returns.',
        'connection'
      );
    } else if (status === 'connected' && previous === 'disconnected') {
      toast.success(
        'Back online',
        'Realtime sync has been restored.',
        'connection'
      );
    }
    previousStatus.current = status;
  }, [status]);

  return (
    <div className="app">
      <AppHeader />
      <main className="app__main">
        <div className="app__top">
          <div className="app__party">
            <Heroes />
          </div>
          <aside className="app__ledger">
            <Gold />
            <Fame />
            <Calendar />
          </aside>
        </div>
        <div className="app__notebook">
          <Quests />
          <NPCs />
          <Locations />
          <Keywords />
        </div>
        <Journal />
        <StoryPoints />
      </main>
      <footer className="app__footer">
        Track the party, the purse, and the tale — your tabletop campaign companion.
      </footer>
      <GlobalSearch />
      <KeyboardHelp />
      <Toaster />
    </div>
  );
};

export default App;
