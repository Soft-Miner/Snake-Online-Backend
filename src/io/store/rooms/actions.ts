import { Server, Socket } from 'socket.io';
import { Store } from '..';

interface CreateRoomPayload {
  name: string;
  socket: Socket;
}
export const createRoom = (context: Store, payload: CreateRoomPayload) => {
  context.commit({ key: 'createRoom', payload });
};

interface JoinRoomPayload {
  id: string;
  socket: Socket;
}
export const joinRoom = (context: Store, payload: JoinRoomPayload) => {
  context.commit({ key: 'joinRoom', payload });
};

interface LeaveRoomPayload {
  socket: Socket;
  io: Server;
}
export const leaveRoom = (context: Store, payload: LeaveRoomPayload) => {
  const { io, socket } = payload;
  context.commit({ key: 'leaveRoom', payload });

  socket.emit('left-room');
  socket.join('home');
  /** @TODO emitir somente o necessário */
  io.to('home').emit('rooms-updated', context.state.rooms);
};
