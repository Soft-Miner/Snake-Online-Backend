import { Socket } from 'socket.io';

interface Message {
  sender: string;
  text: string;
}

export const message = (socket: Socket) => {
  return (message: string) => {
    const messagePayload: Message = {
      text: message,
      sender: socket.user.nickname,
    };

    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('message', messagePayload);
      }
    }
  };
};
