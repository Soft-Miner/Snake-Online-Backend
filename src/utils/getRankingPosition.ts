import { getRepository, LessThan, MoreThan } from 'typeorm';
import User from '../models/User';

export const getRankingPosition = async (userId: string) => {
  const usersRepository = getRepository(User);

  const user = await usersRepository.findOne(userId);
  if (user) {
    const rankPosition =
      (await usersRepository.count({
        where: [
          {
            points: MoreThan(user.points),
          },
          {
            points: user.points,
            created_at: LessThan(
              user.created_at.toISOString().replace('T', ' ').substring(0, 19)
            ),
          },
        ],
      })) + 1;

    return rankPosition;
  }

  return null;
};
