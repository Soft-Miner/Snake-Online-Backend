import { Connection } from 'typeorm';
import User from '../../models/User';
import AuthenticateService from '../../services/AuthenticateService';

const createUser = async (connection: Connection, user?: User) => {
  const usersRepository = connection.getRepository(User);
  const newUser = usersRepository.create({
    nickname: user?.nickname || 'nickname',
    email: user?.email || 'email@example.com',
    password: '$2b$10$7TOQbrdLq0tUuKgJQjQLd.mn4njjf808A1ojy5uupUABgnZPcW1TG',
  });
  const userSaved = await usersRepository.save(newUser);

  const authenticateResponse = await new AuthenticateService().authenticate(
    userSaved.email as string,
    '123'
  );

  return authenticateResponse;
};

export default createUser;
