import { Connection } from 'typeorm';
import User from '../../models/User';
import AuthenticateService from '../../services/AuthenticateService';

const createUser = async (connection: Connection, user?: User) => {
  const usersRepository = connection.getRepository(User);
  const newUser = usersRepository.create({
    nickname: user?.nickname || 'nickname',
    email: user?.email || 'email@example.com',
    password: user?.password || '123',
    points: user?.points || 0,
  });
  const userSaved = await usersRepository.save(newUser);

  const authenticateResponse = await new AuthenticateService().authenticate(
    userSaved.email as string,
    user?.password || '123'
  );

  return authenticateResponse;
};

export default createUser;
