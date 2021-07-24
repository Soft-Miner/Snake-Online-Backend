import 'socket.io';
import { User } from './src/io/types/User';

declare module 'socket.io' {
  export interface Socket {
    user: User;
  }
}
