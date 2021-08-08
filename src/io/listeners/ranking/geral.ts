import { Socket } from 'socket.io';
import { getRepository } from 'typeorm';
import User from '../../../models/User';

export const geral = (socket: Socket) => {
  return async () => {
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

    socket.emit('ranking:top', users);
  };
};
