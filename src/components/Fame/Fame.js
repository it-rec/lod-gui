import React, {useEffect, useState} from 'react';
import ValueContainer from '../common/CurrentMaxContainer/ValueContainer';
import HeadlineContainer from '../common/HeadlineContainer/HeadlineContainer';
import {get, post} from '../../utils/netowrkUtils';
import {collections} from '../../shared';
import socketIOClient from 'socket.io-client';

const fameAPIPath = '/api/game/1/fame/';

const Fame = () => {
  const [fame, setFame] = useState(0);
  const [socket, setSocket] = useState();

  const shapeFameResponse = (response) => response?.fame || 0;

  useEffect(() => {
    get(fameAPIPath).then(response => setFame(shapeFameResponse(response)));

    setSocket(socketIOClient());

    return () => {
      socket?.disconnect();
    };
  },
  []);

  const updateFame = (fameToSet) => {
    setFame(fameToSet);
    post(fameAPIPath, {fame: fameToSet});
  };

  useEffect(() => {
    if (socket) {
      socket.on('connect_error', (error) => {
        console.error('error');
        console.error(error);
      });
      socket.on(collections.FAME, (fameEvent) => {
        setFame(shapeFameResponse(fameEvent));
      });
    }
  }, [socket]);

  return (
    <HeadlineContainer headLine={'Fame'} >
      <ValueContainer
        current={fame}
        setCurrent={updateFame}
      />
    </HeadlineContainer>
  );
};

export default Fame;