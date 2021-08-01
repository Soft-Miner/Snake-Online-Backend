import { Socket } from 'socket.io';
import { Store } from '..';
import { Direction, Game } from './types';

interface ChangeDirectionPayload {
  socket: Socket;
  direction: Direction;
  gameId: string;
}
export const changeDirection = (
  context: Store,
  payload: ChangeDirectionPayload
) => {
  context.commit({ key: 'changeDirection', payload });
};

interface NewGamePayload {
  game: Game;
}
export const newGame = (context: Store, payload: NewGamePayload) => {
  context.commit({ key: 'newGame', payload });
};
