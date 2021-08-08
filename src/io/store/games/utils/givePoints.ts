import { getRepository } from 'typeorm';
import User from '../../../../models/User';

export const givePoints = async (userId: string, points: number) => {
  const usersRepository = getRepository(User);

  const user = await usersRepository.findOne(userId);

  if (user) {
    user.points += points;

    await usersRepository.save(user);
  }
};
