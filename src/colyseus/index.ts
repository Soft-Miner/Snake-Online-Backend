import { Server } from 'colyseus';
import { GameRoom, Lobby } from './rooms';

export const configureColyseus = (server: Server) => {
  server.define('lobby', Lobby);
  server.define('game', GameRoom).enableRealtimeListing();
};
