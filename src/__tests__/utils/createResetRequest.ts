import { Connection } from 'typeorm';
import PasswordResetRequest from '../../models/PasswordResetRequest';
import User from '../../models/User';

const createUser = async (connection: Connection) => {
  const request_secret = 'secret';
  const usersRepository = connection.getRepository(User);
  const user = usersRepository.create({
    nickname: 'nickname',
    email: 'email@example.com',
    password: '123',
    points: 0,
  });
  await usersRepository.save(user);

  const resetRequestsRepository =
    connection.getRepository(PasswordResetRequest);
  const resetRequest = resetRequestsRepository.create({
    user_id: user.id,
    request_secret,
  });
  await resetRequestsRepository.save(resetRequest);

  return { requestId: resetRequest.id, request_secret };
};

export default createUser;
