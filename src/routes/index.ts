import { Router } from 'express';
import UsersRoutes from './users';
import AuthRoute from './auth';

const routes = Router();

routes.use(UsersRoutes);
routes.use(AuthRoute);

export default routes;
