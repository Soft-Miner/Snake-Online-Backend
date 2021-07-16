import 'reflect-metadata';
import express from 'express';
import 'express-async-errors';
import cors from 'cors';

import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './swagger.json';

import routes from './routes';
import { appError } from './middlewares/appError';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api', routes);
app.use(appError());

export default app;
