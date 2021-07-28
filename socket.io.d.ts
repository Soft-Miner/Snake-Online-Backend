import 'socket.io';
import { User } from './src/io/store/users/types';

declare module 'socket.io' {
  export interface Socket {
    user: User;
  }
}
