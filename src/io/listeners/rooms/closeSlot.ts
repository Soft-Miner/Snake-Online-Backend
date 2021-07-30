import { Server, Socket } from 'socket.io';
import store from '../../store';

export const closeSlot = (socket: Socket, io: Server) => {
  return (index: number) => {
    store.dispatch({ type: 'closeSlot', payload: { socket, io, index } });
  };
};
