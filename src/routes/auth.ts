import { Router } from 'express';
import AuthenticateController from '../controller/AuthenticateController';

const routes = Router();

const authController = new AuthenticateController();

routes.post('/authenticate', authController.authenticate);

routes.post('/refresh_token', authController.refreshToken);

export default routes;
