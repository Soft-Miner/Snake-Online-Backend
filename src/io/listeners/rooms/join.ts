import { Server, Socket } from 'socket.io';

const emitUpdatesToHome = (io: Server) => {
  // io.to('home').emit('')
};

export const join = (socket: Socket, io: Server) => {
  return (roomId: string) => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.leave(room);
      }
    }

    if (roomId === 'home') {
      socket.join(roomId);
      socket.emit('joined-room', roomId);

      emitUpdatesToHome(io);
      return;
    }

    // Verifica se a sala está disponivel
    const available = true;

    if (available) {
      socket.join(roomId);
      // Emite que entrou na sala socket.emit('joined-room', roomId);

      emitUpdatesToHome(io);
      // Manda atualização para a sala
    } else {
      socket.emit('join-room-error', 'room not available');
    }
  };
};
