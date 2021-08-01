import { Socket } from 'socket.io';
import { State } from '../types';
import { Direction, Game } from './types';

interface ChangeDirectionPayload {
  socket: Socket;
  direction: Direction;
  gameId: string;
}
export const changeDirection = (
  state: State,
  payload: ChangeDirectionPayload
) => {
  const { socket, direction, gameId } = payload;

  const validDirection =
    Math.abs(direction.x + direction.y) === 1 &&
    (direction.x === 0 || direction.y === 0);
  if (!validDirection) return state;

  const game = state.games.find((item) => item.id === gameId);
  if (!game) return state;

  const user = game.users.find((item) => item.id === socket.user.id);
  if (!user || user.body.length === 0) return state;

  const snakeDirection = {
    x: user.head.x - user.body[0].x,
    y: user.head.y - user.body[0].y,
  };
  if (direction.x === -snakeDirection.x && direction.y === -snakeDirection.y)
    return state;

  user.direction.x = direction.x;
  user.direction.y = direction.y;

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
