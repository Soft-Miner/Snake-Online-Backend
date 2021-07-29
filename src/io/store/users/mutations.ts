import { Server, Socket } from 'socket.io';
import { State } from '../types';

interface LeaveGamePayload {
  socket: Socket;
}
export const leaveGame = (state: State, payload: LeaveGamePayload) => {
  const { socket } = payload;

  const indexToRemove = state.users.findIndex(
    (user) => user.id === socket.user.id
  );

  if (indexToRemove !== -1) {
    state.users.splice(indexToRemove, 1);
  }

  socket.to('home').emit('users-updated', state.users.length);

  console.log(`User disconnected: ${socket.user.nickname}`);

  return state;
};

interface EnterGamePayload {
  socket: Socket;
  io: Server;
}
export const enterGame = (state: State, payload: EnterGamePayload) => {
  const { socket, io } = payload;

  console.log(`User connected: ${socket.user.nickname}`);
  socket.join('home');

  state.users.push(socket.user);

  io.to('home').emit('users-updated', state.users.length);
  socket.emit('rooms-updated', state.rooms);

  return state;
};
