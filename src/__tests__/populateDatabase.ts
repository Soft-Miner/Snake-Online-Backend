import { Connection } from 'typeorm';
import User from '../models/User';

const PopulateDatabase = async (connection: Connection) => {
  const usersRepository = connection.getRepository(User);
  const user = usersRepository.create({
    nickname: 'test',
    email: 'test@test.com',
    password: '$2b$10$7TOQbrdLq0tUuKgJQjQLd.mn4njjf808A1ojy5uupUABgnZPcW1TG',
  });
  await usersRepository.save(user);
};

export default PopulateDatabase;
