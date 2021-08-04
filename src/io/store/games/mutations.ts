import { Socket } from 'socket.io';
import { State } from '../types';
import { directions, Game } from './types';

interface ChangeDirectionPayload {
  socket: Socket;
  direction: number;
  gameId: string;
}
export const changeDirection = (
  state: State,
  payload: ChangeDirectionPayload
) => {
  const { socket, direction: directionNumber, gameId } = payload;
  const direction = directions[directionNumber];

  if (!direction) return state;

  const game = state.games.find((item) => item.id === gameId);
  if (!game) return state;

  const user = game.users.find((item) => item.id === socket.user.id);
  if (!user || user.body.length === 0) return state;

  user.lastDirections.push(direction);
  user.lastDirections.splice(0, 1);

  return state;
};

interface NewGamePayload {
  game: Game;
}
export const newGame = (state: State, payload: NewGamePayload) => {
  const { game } = payload;

  state.games.push(game);

  return state;
};
