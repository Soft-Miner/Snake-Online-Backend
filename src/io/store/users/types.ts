import { Socket } from 'socket.io';

export interface User {
  id: string;
  nickname: string;
  email: string;
  points: number;
  socket: Socket;
}
