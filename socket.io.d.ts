import 'socket.io';

declare module 'socket.io' {
  export interface Socket {
    user: {
      id: string;
      nickname: string;
      email: string;
      points: number;
    };
  }
}
