import { Socket } from 'socket.io';
import store from '../../store';

export const changeDirection = (socket: Socket) => {
  return (direction: number, gameId: string) => {
    store.dispatch({
      type: 'changeDirection',
      payload: { socket, direction, gameId },
    });
  };
};
