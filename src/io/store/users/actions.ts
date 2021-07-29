import { Server, Socket } from 'socket.io';
import { Store } from '..';

interface LeaveGamePayload {
  socket: Socket;
  io: Server;
}
export const leaveGame = (context: Store, payload: LeaveGamePayload) => {
  context.commit({ key: 'leaveRoom', payload });
  context.commit({ key: 'leaveGame', payload });
};

interface EnterGamePayload {
  socket: Socket;
  io: Server;
}
export const enterGame = (context: Store, payload: EnterGamePayload) => {
  context.commit({ key: 'enterGame', payload });
};
