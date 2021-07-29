import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import * as chatListeners from './listeners/chat';
import * as roomsListeners from './listeners/rooms';
import { verifyJWT } from './middlewares/verifyJWT';
import store from './store';

export const configureSocketIo = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {},
  });

  io.use(verifyJWT);

  io.on('connection', (socket) => {
    store.dispatch({ type: 'enterGame', payload: { socket, io } });

    socket.on('message', chatListeners.message(socket));
    socket.on('create-room', roomsListeners.create(socket));
    socket.on('join-room', roomsListeners.join(socket));
    socket.on('leave-room', roomsListeners.leave(socket, io));

    socket.on('disconnecting', () => {
      store.dispatch({ type: 'leaveGame', payload: { socket, io } });
    });
  });
};
