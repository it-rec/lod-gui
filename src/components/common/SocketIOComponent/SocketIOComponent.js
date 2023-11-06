import {useEffect, useState} from 'react';
import socketIOClient from 'socket.io-client';

const SocketIOComponent = ({channel, callback, children}) => {
  const [socket, setSocket] = useState();

  useEffect(() => {

    setSocket(socketIOClient());

    return () => {
      socket?.disconnect();
    };
  },
  []);

  useEffect(() => {
    if (socket) {
      socket.on('connect_error', (error) => {
        console.error('error');
        console.error(error);
      });
      socket.on(channel, (event) => {
        callback(event);
      });
    }
  }, [socket]);


  return children;
};

export default SocketIOComponent;
