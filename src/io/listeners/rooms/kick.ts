import { Server, Socket } from 'socket.io';
import store from '../../store';

export const kick = (socket: Socket, io: Server) => {
  return (userId: string) => {
    store.dispatch({ type: 'kickPlayer', payload: { socket, io, userId } });
  };
};
