import Panel from '../common/Panel/Panel';
import StatCounter from '../common/StatCounter/StatCounter';
import Skeleton from '../common/Skeleton/Skeleton';
import LootSplitter from '../LootSplitter/LootSplitter';
import { IconCoins } from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';

const Gold = () => {
  const { value, save, loading, error, reload } = useGameChannel({
    channel: collections.GOLD,
    path: '/api/game/1/gold/',
    initial: 0,
    fromServer: (raw) => raw?.gold ?? 0,
    toServer: (gold) => ({ gold }),
  });

  return (
    <Panel
      icon={<IconCoins />}
      title="Gold"
      subtitle="The party's coin"
      error={error}
      onRetry={reload}
    >
      {loading ? (
        <Skeleton height="6.5rem" />
      ) : (
        <>
          <StatCounter value={value} onChange={save} watermark={<IconCoins />} />
          <LootSplitter />
        </>
      )}
    </Panel>
  );
};

export default Gold;
