import React, { useEffect, useState } from 'react';
import ValueContainer from '../common/CurrentMaxContainer/ValueContainer';
import HeadlineContainer from '../common/HeadlineContainer/HeadlineContainer';
import {get, post} from '../../utils/netowrkUtils';
import {collections} from '../../shared';
import SocketIOComponent from '../common/SocketIOComponent/SocketIOComponent';

const goldAPIPath = '/api/game/1/gold/';

const Gold = () => {
  const [gold, setGold] = useState(0);

  const shapeGoldResponse = (response) => response?.gold || 0;

  useEffect(() => {
    get(goldAPIPath).then(response => setGold(shapeGoldResponse(response)));
  },
  []);

  const updateGold = (goldToSet) => {
    setGold(goldToSet);
    post(goldAPIPath, {gold: goldToSet});
  };

  return (
    <SocketIOComponent
      callback={(fameEvent) => setGold(shapeGoldResponse(fameEvent))}
      channel={collections.GOLD}
    >
      <HeadlineContainer headLine={'Gold'}>
        <ValueContainer
          current={gold}
          setCurrent={updateGold}
        />
      </HeadlineContainer>
    </SocketIOComponent>
  );
};

export default Gold;
