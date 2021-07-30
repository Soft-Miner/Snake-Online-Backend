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

interface KickPlayerPayload {
  socket: Socket;
  io: Server;
  userId: string;
}
export const kickPlayer = (context: Store, payload: KickPlayerPayload) => {
  context.commit({ key: 'kickPlayer', payload });
};

interface OpenSlotPayload {
  socket: Socket;
  io: Server;
  index: number;
}
export const openSlot = (context: Store, payload: OpenSlotPayload) => {
  context.commit({ key: 'openSlot', payload });
};
interface CloseSlotPayload {
  socket: Socket;
  io: Server;
  index: number;
}
export const closeSlot = (context: Store, payload: CloseSlotPayload) => {
  context.commit({ key: 'closeSlot', payload });
};

interface GameReadyPayload {
  socket: Socket;
  io: Server;
  ready: boolean;
}
export const gameReady = (context: Store, payload: GameReadyPayload) => {
  context.commit({ key: 'gameReady', payload });
};
