import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { getRepository } from 'typeorm';
import { tokenPayload } from '../../middlewares/verifyJWT';
import User from '../../models/User';
import store from '../store';
import { User as SocketUser } from '../store/users/types';

export const verifyJWT = (
  socket: Socket,
  next: (err?: ExtendedError | undefined) => void
) => {
  if (
    socket.handshake.query &&
    typeof socket.handshake.query.token === 'string'
  ) {
    jwt.verify(
      socket.handshake.query.token,
      process.env.JWT_SECRET as string,
      async (err, decoded) => {
        if (err) return next(new Error('Invalid token.'));

        const usersRepository = getRepository(User);
        const user = await usersRepository.findOne(
          (decoded as tokenPayload).id,
          { select: ['id', 'email', 'nickname', 'points'] }
        );

        if (!user) {
          return next(new Error('User not found.'));
        }

        const userAlreadyConnected = store.state.users.find(
          (item) => item.id === user.id
        );

        if (userAlreadyConnected) {
          return next(new Error('User already connected.'));
        }

        socket.user = user as SocketUser;

        next();
      }
    );
  } else {
    next(new Error('Invalid token.'));
  }
};
