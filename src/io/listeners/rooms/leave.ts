import { Server, Socket } from 'socket.io';
import store from '../../store';

export const leave = (socket: Socket, io: Server) => {
  return () => {
    /** @TODO tratar possíveis erros */
    store.dispatch({ type: 'leaveRoom', payload: { socket, io } });
  };
};
