import { monitor } from '@colyseus/monitor';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { Server } from 'colyseus';
import { Express } from 'express';
import { createServer } from 'http';
import { GameRoom, Lobby } from './rooms';

export const configureColyseus = (app: Express) => {
  app.use(
    '/colyseus',
    monitor({
      columns: [
        'roomId',
        'name',
        'clients',
        { metadata: 'name' },
        { metadata: 'playing' },
        { metadata: 'mapSize' },
        { metadata: 'maxClients' },
        'locked',
        'elapsedTime',
      ],
    })
  );

  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: createServer(app),
    }),
  });

  gameServer.define('lobby', Lobby);
  gameServer.define('game', GameRoom).enableRealtimeListing();

  return gameServer;
};
