import { Socket } from 'socket.io';
import { getRankingPosition } from '../../../utils/getRankingPosition';

export const socketJoinHome = (socket: Socket) => {
  socket.join('home');

  getRankingPosition(socket.user.id).then((position) => {
    if (position) {
      socket.emit('ranking:position', position);
    }
  });
};
