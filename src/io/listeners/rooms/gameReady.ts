import { Server, Socket } from 'socket.io';
import store from '../../store';

export const gameReady = (socket: Socket, io: Server) => {
  return (ready: boolean) => {
    store.dispatch({ type: 'gameReady', payload: { socket, io, ready } });
  };
};
