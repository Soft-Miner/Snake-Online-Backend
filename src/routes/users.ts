import { Router } from 'express';
import UsersController from '../controller/UsersController';
import { verifyJWT } from '../middlewares/verifyJWT';

const routes = Router();

const usersController = new UsersController();

routes.post('/register', usersController.create);
routes.post('/request-new-password', usersController.requestNewPassword);
routes.post('/users/new-password', usersController.newPassword);
routes.put(
  '/users/change-password',
  verifyJWT(),
  usersController.updatePassword
);

export default routes;
