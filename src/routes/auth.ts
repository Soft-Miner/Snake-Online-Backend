import { Router } from 'express';
import AuthenticateController from '../controller/AuthenticateController';

const routes = Router();

const authController = new AuthenticateController();

routes.post('/authenticate', authController.authenticate);

export default routes;
