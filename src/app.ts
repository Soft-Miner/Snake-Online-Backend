import 'reflect-metadata';
import express from 'express';
import 'express-async-errors';
import cors from 'cors';

import routes from './routes';
import { appError } from './middlewares/appError';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api', routes);
app.use(appError());

export default app;
