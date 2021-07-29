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
  context.commit({ key: 'leaveRoom', payload });
};
