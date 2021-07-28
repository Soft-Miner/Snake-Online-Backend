import { Socket } from 'socket.io';
import { Store } from '..';

interface LeaveGamePayload {
  socket: Socket;
}
export const leaveGame = (context: Store, payload: LeaveGamePayload) => {
  context.commit({ key: 'leaveRoom', payload });
  context.commit({ key: 'leaveGame', payload });
};

interface EnterGamePayload {
  socket: Socket;
}
export const enterGame = (context: Store, payload: EnterGamePayload) => {
  context.commit({ key: 'enterGame', payload });
};
