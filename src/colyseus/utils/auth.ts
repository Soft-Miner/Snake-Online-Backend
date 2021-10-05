import jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import { tokenPayload } from '../../middlewares/verifyJWT';
import User from '../../models/User';

export const auth = async (token: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      async (err, decoded) => {
        if (err) return reject(new Error('Invalid token.'));

        const usersRepository = getRepository(User);
        const user = await usersRepository.findOne(
          (decoded as tokenPayload).id,
          {
            select: ['id', 'email', 'nickname', 'points'],
          }
        );

        if (!user) {
          return reject(new Error('User not found.'));
        }

        /** @TODO verificar se usuário já está conectado */
        // if (userAlreadyConnected) {
        //   return next(new Error('User already connected.'));
        // }

        resolve(user);
      }
    );
  });
};
