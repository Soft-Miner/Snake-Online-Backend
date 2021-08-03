import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import * as chatListeners from './listeners/chat';
import * as gamesListeners from './listeners/games';
import * as roomsListeners from './listeners/rooms';
import { verifyJWT } from './middlewares/verifyJWT';
import store from './store';

export const configureSocketIo = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {},
    pingTimeout: 10000,
    pingInterval: 5000,
  });

  io.use(verifyJWT);

  io.on('connection', (socket) => {
    store.dispatch({ type: 'enterGame', payload: { socket, io } });

    socket.on('ping', () => socket.emit('pong'));

    socket.on('message', chatListeners.message(socket));
    socket.on('create-room', roomsListeners.create(socket));
    socket.on('join-room', roomsListeners.join(socket));
    socket.on('leave-room', roomsListeners.leave(socket, io));
    socket.on('room:kick', roomsListeners.kick(socket, io));
    socket.on('room:open-slot', roomsListeners.openSlot(socket, io));
    socket.on('room:close-slot', roomsListeners.closeSlot(socket, io));
    socket.on('room:update-ready', roomsListeners.gameReady(socket, io));
    socket.on('room:update-config', roomsListeners.updateConfig(socket, io));
    socket.on('game:change-direction', gamesListeners.changeDirection(socket));

    socket.on('disconnecting', () => {
      store.dispatch({ type: 'leaveGame', payload: { socket, io } });
    });
  });
};
