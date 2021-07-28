import { Socket } from 'socket.io';
import store from '../../store';

export const join = (socket: Socket) => {
  return (roomId: string) => {
    /** @TODO tratar possíveis erros */
    store.dispatch({ type: 'joinRoom', payload: { id: roomId, socket } });
  };
};
