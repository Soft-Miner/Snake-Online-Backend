import { Socket } from 'socket.io';
import store from '../../store';

export const create = (socket: Socket) => {
  return (name: string) => {
    store.dispatch({ type: 'createRoom', payload: { name, socket } });
  };
};
