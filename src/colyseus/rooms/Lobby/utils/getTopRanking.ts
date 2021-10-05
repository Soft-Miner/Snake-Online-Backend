import { getRepository } from 'typeorm';
import User from '../../../../models/User';

export const getTopRanking = async () => {
  const usersRepository = getRepository(User);
  const users = await usersRepository
    .createQueryBuilder()
    .select('id, nickname, points')
    .addSelect(
      'ROW_NUMBER() OVER (ORDER BY "points" DESC, "created_at") as "position"'
    )
    .offset(0)
    .limit(10)
    .getRawMany();

  return users;
};
