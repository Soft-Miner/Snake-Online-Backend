import { Server, Socket } from 'socket.io';
import store from '../../store';

export const openSlot = (socket: Socket, io: Server) => {
  return (index: number) => {
    store.dispatch({ type: 'openSlot', payload: { socket, io, index } });
  };
};
