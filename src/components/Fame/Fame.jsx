import Panel from '../common/Panel/Panel';
import StatCounter from '../common/StatCounter/StatCounter';
import Skeleton from '../common/Skeleton/Skeleton';
import { IconRenown } from '../common/icons';
import { useGameChannel } from '../../hooks/useGameChannel';
import { collections } from '../../shared';

const Fame = () => {
  const { value, save, loading, error, reload } = useGameChannel({
    channel: collections.FAME,
    path: '/api/game/1/fame/',
    initial: 0,
    fromServer: (raw) => raw?.fame ?? 0,
    toServer: (fame) => ({ fame }),
  });

  return (
    <Panel
      icon={<IconRenown />}
      title="Renown"
      subtitle="Deeds and reputation"
      error={error}
      onRetry={reload}
    >
      {loading ? (
        <Skeleton height="6.5rem" />
      ) : (
        <StatCounter value={value} onChange={save} watermark={<IconRenown />} />
      )}
    </Panel>
  );
};

export default Fame;
