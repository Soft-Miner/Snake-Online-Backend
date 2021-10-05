import { monitor } from '@colyseus/monitor';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { Server } from 'colyseus';
import cors from 'cors';
import express from 'express';
import 'express-async-errors';
import 'reflect-metadata';
import swaggerUi from 'swagger-ui-express';
import { configureColyseus } from './colyseus';
import { appError } from './middlewares/appError';
import routes from './routes';
import swaggerDocs from './swagger.json';

const createServer = (
  process.env.NODE_ENV === 'development' ? require('http') : require('https')
).createServer;

const app = express();

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
app.use(express.json());
app.use(cors());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api', routes);
app.use(appError());

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: createServer(app),
  }),
});

configureColyseus(gameServer);

export default gameServer;
