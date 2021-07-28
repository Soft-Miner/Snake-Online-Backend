import { Socket } from 'socket.io';
import store from '..';
import { State } from '../types';

interface LeaveGamePayload {
  socket: Socket;
}
export const leaveGame = (state: State, payload: LeaveGamePayload) => {
  const { socket } = payload;

  const indexToRemove = store.state.users.findIndex(
    (user) => user.id === socket.user.id
  );

  if (indexToRemove !== -1) {
    store.state.users.splice(indexToRemove, 1);
  }

  socket.to('home').emit('users-updated', store.state.users.length);

  return state;
};

interface EnterGamePayload {
  socket: Socket;
}
export const enterGame = (state: State, payload: EnterGamePayload) => {
  const { socket } = payload;

  console.log(`User connected: ${socket.user.nickname}`);
  socket.join('home');

  /** @TODO Tratar user já existente */

  store.state.users.push(socket.user);

  socket.to('home').emit('users-updated', store.state.users.length);

  return state;
};
