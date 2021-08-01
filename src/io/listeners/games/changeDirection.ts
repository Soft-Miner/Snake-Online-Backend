import { Socket } from 'socket.io';
import store from '../../store';
import { Direction } from '../../store/games/types';

export const changeDirection = (socket: Socket) => {
  return (direction: Direction, gameId: string) => {
    store.dispatch({
      type: 'changeDirection',
      payload: { socket, direction, gameId },
    });
  };
};
