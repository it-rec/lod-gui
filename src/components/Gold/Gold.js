import React, { useEffect, useState } from 'react';
import ValueContainer from '../common/CurrentMaxContainer/ValueContainer';
import HeadlineContainer from '../common/HeadlineContainer/HeadlineContainer';
import {get, post} from '../../utils/netowrkUtils';
import socketIOClient from 'socket.io-client';
import {collections} from '../../shared';

const goldAPIPath = '/api/game/1/gold/';

const Gold = () => {
  const [gold, setGold] = useState(0);
  const [socket, setSocket] = useState();

  const shapeGoldResponse = (response) => response?.gold || 0;

  useEffect(() => {
    get(goldAPIPath).then(response => setGold(response?.gold || 0));

    setSocket(socketIOClient());

    return () => {
      socket?.disconnect();
    };
  },
  []);

  const updateGold = (goldToSet) => {
    setGold(goldToSet);
    post(goldAPIPath, {gold: goldToSet});
  };

  useEffect(() => {
    if (socket) {
      socket.on('connect_error', (error) => {
        console.error('error');
        console.error(error);
      });
      socket.on(collections.GOLD, (fameEvent) => {
        setGold(shapeGoldResponse(fameEvent));
      });
    }
  }, [socket]);

  return (
    <HeadlineContainer headLine={'Gold'}>

      <ValueContainer
        current={gold}
        setCurrent={updateGold}
      />
    </HeadlineContainer>
  );
};

export default Gold;