import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import * as chatListeners from './listeners/chat';
import * as roomsListeners from './listeners/rooms';
import { verifyJWT } from './middlewares/verifyJWT';

export const configureSocketIo = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {},
  });

  io.use(verifyJWT);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.nickname}`);

    socket.on('message', chatListeners.message(socket));
    socket.on('join-room', roomsListeners.join(socket, io));
  });
};
