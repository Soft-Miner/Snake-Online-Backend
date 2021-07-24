import cors from 'cors';
import express from 'express';
import 'express-async-errors';
import 'reflect-metadata';
import swaggerUi from 'swagger-ui-express';
import { appError } from './middlewares/appError';
import routes from './routes';
import swaggerDocs from './swagger.json';
import http from 'http';
import { configureSocketIo } from './io';

const app = express();
const server = http.createServer(app);
configureSocketIo(server);

app.use(express.json());
app.use(cors());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api', routes);
app.use(appError());

export default server;
